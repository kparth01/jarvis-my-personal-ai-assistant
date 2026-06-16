import os

class FileOps():

    def __init__(self):
        pass


    def write_file(self, path: str, content: str):
        try:
            with open(path, "w") as f:
                f.write(content)
            return f"Written to file {path} successfully"
        except Exception as e:
            return f"error occured while writing to file: {path} error: {e}"
        

    def append_file(self, path: str, content: str):
        try:
            with open(path, "a") as f:
                f.write(content)
            return f"Appended to file {path} successfully"
        except Exception as e:
            return f"error occured while appending to file: {path} error: {e}"


    def read_file(self, path: str) -> str:
        try:
            with open(path, "r") as f:
                content = f.read()
                return content
        except Exception as e:
             return f"error occured while reading from file: {path} error: {e}"
        
        
    def delete_file(self, path: str) -> str:
        if os.path.exists(path=path):
            os.remove(path=path)
            return f"Successfully deleted the file {path}"
        else:
            return f"File does not exist {path}"
         

        