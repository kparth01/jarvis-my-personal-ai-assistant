from llm.model_handler_base import ModelResponse, ModelHandlerBase, ToolCallResult
import json

class QwenHandler(ModelHandlerBase):

    def __init__(self):
        pass

    def parse(self, response):
        final_content = self.normalize_response(response=response)
        
        if final_content["type"] == "str":
            return ModelResponse(type="text", content=final_content["content"])

        if final_content["type"] == "json":
            result = final_content["content"]
            return ModelResponse(
                    type="tool_call",
                    tool_calls=[
                        ToolCallResult(
                            name=result["tool_calls"][0]["name"],
                            arguments=result["tool_calls"][0]["arguments"]
                        )
                    ],
                    content=result["content"]
                )
        
        return ModelResponse(type="text", content=final_content["content"])
    
    
    def normalize_response(self, response) -> dict:
        final_content = None
        try:
            if response.message:
                final_content = {
                    "content": response.message.content,
                    "thinking": response.message.thinking,
                    "tool_calls": [
                        {
                            "name": response.message.tool_calls[0].function.name,
                            "arguments": response.message.tool_calls[0].function.arguments,
                        }
                    ]
                }
                return {"type": "json", "content": final_content}
        except Exception:
            return {"type": "str", "content": "Couldn't process the AI response. Please try again later."}



