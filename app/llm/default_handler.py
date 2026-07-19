from llm.model_handler_base import ModelHandlerBase, ModelResponse, ToolCallResult


class DefaultHandler(ModelHandlerBase):

    def parse(self, response) -> ModelResponse:
        if response.message.tool_calls:
            tool_calls = response.message.tool_calls
            for tool_call in tool_calls:
                print(tool_call)
                tool_name = tool_call.function.name
                tool_args = tool_call.function.arguments

                return ModelResponse(
                    type="tool_call",
                    tool_calls=[
                        ToolCallResult(
                            name=tool_name,
                            arguments=tool_args
                        )
                    ]
                )
            
        return ModelResponse(type="text", content=response.message.content)


