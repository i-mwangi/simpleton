import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

# Qwen via Alibaba Cloud Model Studio's OpenAI-compatible endpoint.
client = OpenAI(
    api_key=os.getenv("QWEN_API_KEY") or os.getenv("DASHSCOPE_API_KEY") or "not-set",
    base_url=os.getenv(
        "QWEN_BASE_URL", "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
    ),
)
MODEL = os.getenv("QWEN_MODEL", "qwen3.7-plus")


def generate_latex(prompt: str) -> str:
    system_prompt = f"""
        You are a LaTeX generator.

    Convert the following instruction into valid LaTeX code.

    Rules:
    - Return ONLY LaTeX code
    - Do not include explanations
    - Ensure valid LaTeX syntax
    - Ensure environments close properly

    Instruction:
    {prompt}
    """

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": system_prompt}],
    )
    return response.choices[0].message.content
