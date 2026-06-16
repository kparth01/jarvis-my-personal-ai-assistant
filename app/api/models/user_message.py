
from __future__ import annotations

from typing import Literal
from pydantic import BaseModel, Field
import time

# Role type used by messages
Role = Literal['user', 'assistant', 'system']


class UserMessage(BaseModel):
    """User message model used by the FastAPI endpoints.

    Fields:
    - role: 'user' | 'assistant' | 'system'
    - content: message text
    - timestamp: POSIX timestamp (seconds since epoch)
    """

    role: Role
    content: str
    timestamp: float = Field(default_factory=lambda: time.time())

    class Config:
        schema_extra = {
            "example": {
                "role": "user",
                "content": "Turn on the lights",
                "timestamp": 1670000000.0,
            }
        }
        