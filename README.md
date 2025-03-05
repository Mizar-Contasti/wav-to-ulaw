# WAV to μ-law Converter

Upload your Non-compressed wav formats, format in real time and download the μ-law file.

You can also reproduce the μ-law after format.

Convert as much .wav formats do you want.


## Instruction to use it

- Download
- npm install

### Run at your local

- npm run dev
- open localhost:5174
- Enjoy (No Compressed WAV only allowed)


### Run in Docker

- docker build -t wav-to-ulaw-app .
- docker run -d -p 8080:80 --name wavulaw wav-to-ulaw:latest
- open localhost:8080
- Enjoy (No Compressed WAV only allowed)