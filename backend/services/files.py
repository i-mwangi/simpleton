import io
import json
import uuid
from typing import Optional

import pandas as pd

from cache_redis.client import get_redis

FILE_TTL_SECONDS = 86400  # match session TTL (24h)
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
MAX_SAMPLE_ROWS = 20
MAX_UNIQUE_VALUES = 10

ALLOWED_EXTENSIONS = {".csv"}


class FileValidationError(Exception):
    pass


def _numeric_summary(df: pd.DataFrame) -> dict:
    numeric = df.select_dtypes(include="number")
    if numeric.empty:
        return {}
    stats = numeric.describe().round(4)
    return {col: stats[col].to_dict() for col in stats.columns}


def parse_csv(filename: str, content: bytes) -> dict:
    """Parse an uploaded CSV into a compact summary for LLM context."""
    if len(content) > MAX_FILE_SIZE:
        raise FileValidationError(
            f"File too large ({len(content)} bytes > {MAX_FILE_SIZE} bytes)"
        )
    if not content.strip():
        raise FileValidationError("File is empty")

    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise FileValidationError(f"Could not parse CSV: {e}")

    if df.empty:
        raise FileValidationError("CSV contains no data rows")

    sample = df.head(MAX_SAMPLE_ROWS)
    categorical_values = {}
    for col in df.select_dtypes(exclude="number").columns:
        uniques = df[col].dropna().unique()
        if len(uniques) <= MAX_UNIQUE_VALUES:
            categorical_values[col] = [str(v) for v in uniques]

    return {
        "filename": filename,
        "row_count": int(len(df)),
        "columns": [
            {"name": str(col), "dtype": str(df[col].dtype)} for col in df.columns
        ],
        "numeric_summary": _numeric_summary(df),
        "categorical_values": categorical_values,
        "sample_csv": sample.to_csv(index=False),
    }


def store_file_summary(user_id: str, summary: dict) -> str:
    """Store a parsed file summary in Redis, return its file_id."""
    file_id = str(uuid.uuid4())
    redis = get_redis()
    redis.setex(
        f"file:{user_id}:{file_id}", FILE_TTL_SECONDS, json.dumps(summary)
    )
    return file_id


def get_file_summary(user_id: str, file_id: str) -> Optional[dict]:
    redis = get_redis()
    raw = redis.get(f"file:{user_id}:{file_id}")
    return json.loads(raw) if raw else None


def build_data_context(user_id: str, file_ids: list) -> str:
    """Build the prompt block describing uploaded data files."""
    blocks = []
    for file_id in file_ids:
        summary = get_file_summary(user_id, file_id)
        if not summary:
            continue

        lines = [
            f"### Data file: {summary['filename']} "
            f"({summary['row_count']} rows)",
            "Columns: "
            + ", ".join(
                f"{c['name']} ({c['dtype']})" for c in summary["columns"]
            ),
        ]
        if summary.get("numeric_summary"):
            lines.append(
                "Numeric statistics (per column): "
                + json.dumps(summary["numeric_summary"])
            )
        if summary.get("categorical_values"):
            lines.append(
                "Categorical values: " + json.dumps(summary["categorical_values"])
            )
        lines.append(
            f"First rows (CSV):\n{summary['sample_csv']}"
        )
        blocks.append("\n".join(lines))

    if not blocks:
        return ""

    return (
        "\n\nThe user uploaded the following data file(s). Build the document "
        "from this REAL data: present it with booktabs tables and plot it with "
        "pgfplots (\\addplot table with inline coordinates from the rows below). "
        "Never invent data values that are not derivable from this data.\n"
        "IMPORTANT: column names may contain underscores (e.g. infill_pattern). "
        "A bare _ in LaTeX text breaks compilation. When mentioning a column in "
        "prose or table headers, escape it (\\texttt{infill\\_pattern}) or "
        "rewrite it in words (infill pattern). Never write a raw _ outside math.\n\n"
        + "\n\n".join(blocks)
    )
