from TTS.api import TTS

class TextToSpeech():

    def __init__(self):
        self.model_name = "tts_models/en/ljspeech/tacotron2-DDC"

    def generate_voice(self, llm_input: str, output_path: str):
        tts = TTS(model_name=self.model_name)
        ttf = tts.tts_to_file(text=llm_input, file_path=output_path)