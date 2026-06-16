
## Command to install dependencies
`pip install faster-whisper`
`pip install TTS`
`pip install requests python-multipart fastapi uvicorn`

`cd app`
`uvicorn main:app --reload`

## Open browser in Dev Mode:
`open -na "Google Chrome" --args --disable-web-security --disable-site-isolation-trials --user-data-dir="/tmp/chrome_dev_session"`