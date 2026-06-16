from faster_whisper import WhisperModel

class SpeechToText():

    def __init__(self):
        self.model = WhisperModel("base", compute_type="float32")

    def generate_transcript(self, audio_path: str) -> str:
        segments, info = self.model.transcribe(audio_path)
        
        words = []
        for s in segments:
            words.append(s.text)

        transcript = " ".join(words)
        return transcript
    
    
