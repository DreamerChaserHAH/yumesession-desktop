# YumeSession
> YumeSession is a desktop meeting-assistant application that listens onto whatever kind of meeting you might have (phone calls, google meets, you name it) via your microphone and device audio, and help you with
> 1. Transcript
> 2. Summarization
> 3. Real-Time AI Assistant
> 4. Contextual Notes
> 5. Browser Streaming (to display and search what other people are talking about if the topic become complicated)

This project is built using [Wails](https://wails.io) and [React](https://reactjs.org). Python is also implemented for AI Agent and interacting with LLMs, and also virtual browser access.

## How to run the project
1. Install [Go](https://go.dev/doc/install) and [Node.js](https://nodejs.org/en/download/)
   - Make sure to install the latest LTS version of Node.js
   - Install [Python 3.10+](https://www.python.org/downloads/) (required for AI Agent)
   - Install [Node.js dependencies](https://nodejs.org/en/download/package-manager/) (required for frontend)
2. Clone the repository
3. cd in python directory and run setup.sh or setup.bat to install Python dependencies
4. in the parent repository run
```bash
wails dev
```