import requests
import json

class WebSearch():

    def __init__(self):
        self.url = "https://api.duckduckgo.com/"
        self.format = "json"
        self.searXNG_url = "http://localhost:8888/search"
        self.headers = {
            "User-Agent": "Mozilla/5.0 (compatible; VoiceAgent/1.0)",
            "Accept": "application/json",
        }

    
    def search_ddg(self, search_str: str):
        params = {"q": search_str, "format": self.format}
        response = requests.get(self.url, params=params)
        result = response.json()
        return result
    

    def search_searXNG(self, search_str: str):
        params = {"q": search_str, "format": "json", "language": "en"}
        response = requests.get(self.searXNG_url, params=params, headers=self.headers)
        resp_json = response.json()
        content = [r["content"] for r in resp_json.get("results", [])[:5] if "content" in r]
        flat_text = "\n\n".join(content)
        print(flat_text)
        return flat_text


    def fetch_related_topics(self, search_str: str):
        response = self.search_ddg(search_str=search_str)
        related = [r["Text"] for r in response.get("RelatedTopics", [])[:5] if "Text" in r]
        return related


    def fetch_instant_answer(self, search_str: str):
        response = self.search_ddg(search_str)
        print(json.dumps(response.get("AbstractText", "No instant answer available.")))
        return response.get("AbstractText", "No instant answer available.")


if __name__ == "__main__":
    ws = WebSearch()
    ws.search_searXNG("Find me flight from Singapore to Mumbai economy class for 2 people")