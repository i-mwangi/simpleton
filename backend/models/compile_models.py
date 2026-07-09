from typing import List, Optional

from pydantic import BaseModel

class CompileRequest(BaseModel):
    latex: str
    file_ids: Optional[List[str]] = []


class CompileResponse(BaseModel):
    response: str