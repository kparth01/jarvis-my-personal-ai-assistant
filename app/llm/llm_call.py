import requests
from tools.web_search import WebSearch
from tools.file_ops import FileOps
from tools.calculator import Calculator
from ollama import chat
from llm.default_handler import DefaultHandler
from llm.model_handler_base import ModelResponse
from llm.qwen_handler import QwenHandler


QWEN_SMART_MODEL = "qwen3.5:9b"
QWEN_SMALL_MODEL = "qwen2.5-coder:14b"
QWEN_GENERAL = "qwen2.5:7b"
RESPONSE_MODEL = "gemma4:12b"


MY_INFO = """You are Jarvis, a personal AI assistant exclusively for Parth, 
a Senior Software Engineer in Singapore. You respond only to Parth. 
Be concise, direct, and technical. Address Parth by name when appropriate.
Respond like an intelligent system — not a chatbot. 
Do not introduce yourself unless asked; assume Parth knows who you are.
Do not make up facts or add unnecessary information.
Keep replies under 3 sentences unless asked to elaborate."""

TOOL_INSTRUCTION = """
You have access to the following tools:
- search_searXNG: Use this for any question about current events, facts or information you are unsure about.
- write_file / append_file / read_file / delete_file: Use these when Parth explicitly asks to save, read or delete a file.
- add / subtract / multiply / divide: Use these for arithmetic calculations from the tool provided.

You must use tools over guessing or hallucinating.
"""

SYSTEM_MESSAGE = MY_INFO + TOOL_INSTRUCTION + " \nYour final spoken reply must be plain-text. No JSON, no markdown, no formatting."


tool_schemas = [
    {
        "type": "function",
        "function": {
            "name": "search_searXNG",
            "description": "Search the web / internet for a search_str with related topics",
            "parameters": {
                "type": "object",
                "required": ["search_str"],
                "properties": {
                    "search_str": {"type": "string", "description": "Search input"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "write_file",
            "description": "Create file & write text to a file",
            "parameters": {
                "type": "object",
                "required": ["path", "content"],
                "properties": {
                    "path": {"type": "string", "description": "Path of the file"},
                    "content": {"type": "string", "description": "content of the file "}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "append_file",
            "description": "Append text to a file",
            "parameters": {
                "type": "object",
                "required": ["path", "content"],
                "properties": {
                    "path": {"type": "string", "description": "Path of the file"},
                    "content": {"type": "string", "description": "content of the file "}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "read_file",
            "description": "Read text from a file",
            "parameters": {
                "type": "object",
                "required": ["path"],
                "properties": {
                    "path": {"type": "string", "description": "Path of the file"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "delete_file",
            "description": "Delete a file",
            "parameters": {
                "type": "object",
                "required": ["path"],
                "properties": {
                    "path": {"type": "string", "description": ""}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "add",
            "description": "Add two numbers",
            "parameters": {
                "type": "object",
                "required": ["x", "y"],
                "properties": {
                    "x": {"type": "number", "description": "First number"},
                    "y": {"type": "number", "description": "Second number"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "subtract",
            "description": "Subtract y from x",
            "parameters": {
                "type": "object",
                "required": ["x", "y"],
                "properties": {
                    "x": {"type": "number", "description": "First number"},
                    "y": {"type": "number", "description": "Second number"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "multiply",
            "description": "Multiply two numbers",
            "parameters": {
                "type": "object",
                "required": ["x", "y"],
                "properties": {
                    "x": {"type": "number", "description": "First number"},
                    "y": {"type": "number", "description": "Second number"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "divide",
            "description": "Divide x by y",
            "parameters": {
                "type": "object",
                "required": ["x", "y"],
                "properties": {
                    "x": {"type": "number", "description": "Numerator"},
                    "y": {"type": "number", "description": "Divisor"}
                }
            }
        }
    }
]

HANDLERS = {
    "qwen2.5:7b": DefaultHandler(),
    "qwen2.5-coder:14b": QwenHandler(),
}

class LLMCall():

    def __init__(self):
        self.url = "http://localhost:11434/api/chat"
        self.context = []
        self.available_tools = {
            "search_searXNG": WebSearch().search_searXNG,
            "write_file": FileOps().write_file,
            "append_file": FileOps().append_file,
            "read_file": FileOps().read_file,
            "delete_file": FileOps().delete_file,
            "add": Calculator().add,
            "subtract": Calculator().subtract,
            "multiply": Calculator().multiply,
            "divide": Calculator().divide,
        }
        self.active_model = QWEN_SMART_MODEL


    def _generate_topic(self, transcript: str) -> str:
        """Generate a topic for the users chat based on first message"""
        prompt = [
            {"role": "user",
             "content": f"Give 3-5 word title summarizing the users message: {transcript}. Reply strictly with title, no punctuations."}
        ]

        result = chat(model=QWEN_GENERAL, messages=prompt)
        return result.message.content.strip()
    
    def generate_response(self, transcript: str) -> tuple[str, str | None]:
        topic: str = ""
        if len(self.context) == 0:
            self.context.append({"role": "system", "content": SYSTEM_MESSAGE})
            topic = self._generate_topic(transcript=transcript)
            

        self.context.append({
                "role": "user",
                "content": transcript
            })

        response = chat(model=self.active_model, 
                        messages=self.context, 
                        tools=tool_schemas,
                        options={"temperature": 0.1},
                        stream=False
                    )
        
        if self.active_model == QWEN_GENERAL:
            handler = HANDLERS.get(QWEN_GENERAL, DefaultHandler())
            model_response: ModelResponse = handler.parse(response=response)
        
        elif self.active_model == QWEN_SMART_MODEL:
            handler = HANDLERS.get(QWEN_SMART_MODEL, QwenHandler())
            model_response: ModelResponse = handler.parse(response=response)

        if model_response.tool_calls:
            self.context.append(self.to_ollama_message(model_response))

        if model_response.tool_calls:
            tool_calls = model_response.tool_calls
            tool_result = []
            for tool_call in tool_calls:
                print("Invoking tool call: ", tool_call.name)
                tool_name = tool_call.name
                tool_args = tool_call.arguments

                tool_fn = self.available_tools.get(tool_name)
                if not tool_fn:
                    return f"Tool not found {tool_name}"

                
                result = tool_fn(**tool_args)
                print(result)
                tool_result.append(result)

                self.context.append({
                    "role": "tool",
                    "content": str(result),
                })

            # tool_response = " ".join(tool_result) if len(tool_result) > 0 else "" 

            self.context.append({
                "role": "user",
                "content": f"Summarize this final response from all the tool calls in 2-3 sentence in professional tone. Don't put codes there."
            })

            final_response = chat(model=RESPONSE_MODEL, messages=self.context)

            text = final_response.message.content
            self.context.append({ "role": "assistant", "content": text})
            return text, topic
                    
        else:
            text = response.message.content
            return text, topic
    
    def to_ollama_message(self, response: ModelResponse) -> dict:
        msg = {
            "role": "assistant",
            "content": response.content or "",
        }

        if response.type == "tool_call" and response.tool_calls:
            msg["tool_calls"] = [
                {
                    "function": {
                        "name": tc.name,
                        "arguments": tc.arguments
                    }
                }
                for tc in response.tool_calls
            ]

        return msg