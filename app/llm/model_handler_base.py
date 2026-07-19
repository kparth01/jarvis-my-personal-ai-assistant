from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Literal


@dataclass
class ToolCallResult:
    name: str
    arguments: dict


@dataclass
class ModelResponse:
    type: Literal["tool_call", "text"]
    content: str | None = None
    tool_calls: list[ToolCallResult ]| None = None


class ModelHandlerBase(ABC):

    @abstractmethod
    def parse(self, response) -> ModelResponse:
        """ All model response must be parsed using this method """
        ...



