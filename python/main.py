# pip install fastapi uvicorn playwright websockets
# playwright install chromium

from fastapi import FastAPI, Response, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from playwright.async_api import async_playwright
import io
import uvicorn
import time
import asyncio
import json
import aiohttp
from typing import AsyncGenerator
import screeninfo
from beeai_framework.backend.chat import ChatModel
from beeai_framework.workflows.agent import AgentWorkflow, AgentWorkflowInput
from pydantic import BaseModel

app = FastAPI()

# Add CORS middleware to allow embedding in other projects
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for browser management
browser_instance = None
page_instance = None
playwright_instance = None
browser_lock = asyncio.Lock()

async def init_browser():
    """Initialize a persistent browser instance"""
    global browser_instance, page_instance, playwright_instance
    async with browser_lock:
        if browser_instance is None:
            playwright_instance = await async_playwright().start()
            browser_instance = await playwright_instance.chromium.launch(
                headless=True,
                args=[
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu',
                    '--disable-extensions',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-renderer-backgrounding'
                ]
            )
            page_instance = await browser_instance.new_page()

            # Performance optimizations
            screen = screeninfo.get_monitors()[0]
            width = int(screen.width * 0.25)
            height = 720
            await page_instance.set_viewport_size({"width": width, "height": height})
            await page_instance.set_extra_http_headers({"Cache-Control": "no-cache"})

            # Disable images and CSS for faster loading (optional)
            # await page_instance.route("**/*.{png,jpg,jpeg,gif,svg,css}", lambda route: route.abort())

            await page_instance.goto("https://www.ibm.com/granite")

async def cleanup_browser():
    """Clean up browser resources"""
    global browser_instance, page_instance, playwright_instance
    async with browser_lock:
        if browser_instance:
            await browser_instance.close()
            browser_instance = None
            page_instance = None
        if playwright_instance:
            await playwright_instance.stop()
            playwright_instance = None

async def generate_mjpeg_stream() -> AsyncGenerator[bytes, None]:
    """Generate MJPEG stream from browser screenshots"""
    await init_browser()

    try:
        while True:
            start_time = asyncio.get_event_loop().time()

            async with browser_lock:
                if page_instance:
                    try:
                        # Take screenshot with optimized settings
                        screenshot = await page_instance.screenshot(
                            type='jpeg',  # JPEG is faster than PNG
                            quality=75,   # Balance between quality and speed
                            full_page=False  # Only visible area
                        )

                        # Create MJPEG frame with JPEG content type
                        frame = (
                            b'--frame\r\n'
                            b'Content-Type: image/jpeg\r\n\r\n' +
                            screenshot +
                            b'\r\n'
                        )
                        yield frame

                    except Exception as e:
                        print(f"Error taking screenshot: {e}")
                        break

            # Dynamic frame rate - maintain consistent timing
            elapsed = asyncio.get_event_loop().time() - start_time
            target_fps = 20  # Increased from 10 to 20 FPS
            frame_time = 1.0 / target_fps
            sleep_time = max(0, frame_time - elapsed)

            if sleep_time > 0:
                await asyncio.sleep(sleep_time)

    except Exception as e:
        print(f"Stream error: {e}")
        await cleanup_browser()

@app.get("/")
def home():
    """Serve a simple HTML page to view the stream and chat"""
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Browser Stream & AI Chat</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                background-color: #f0f0f0;
            }
            .container {
                max-width: 1400px;
                margin: 0 auto;
                display: grid;
                grid-template-columns: 1fr 400px;
                gap: 20px;
            }
            .stream-section {
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .chat-section {
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                display: flex;
                flex-direction: column;
                height: 600px;
            }
            h1, h2 {
                color: #333;
                margin-top: 0;
            }
            img {
                max-width: 100%;
                height: auto;
                border: 2px solid #ddd;
                border-radius: 4px;
            }
            .controls {
                margin-top: 20px;
            }
            button {
                padding: 10px 20px;
                margin: 5px;
                border: none;
                border-radius: 4px;
                background-color: #007bff;
                color: white;
                cursor: pointer;
                font-size: 16px;
            }
            button:hover {
                background-color: #0056b3;
            }
            .chat-messages {
                flex: 1;
                overflow-y: auto;
                border: 1px solid #ddd;
                border-radius: 4px;
                padding: 10px;
                margin-bottom: 10px;
                background: #f9f9f9;
            }
            .message {
                margin-bottom: 10px;
                padding: 8px;
                border-radius: 4px;
            }
            .user-message {
                background: #007bff;
                color: white;
                text-align: right;
            }
            .ai-message {
                background: #e9ecef;
                color: #333;
            }
            .chat-input {
                display: flex;
                gap: 10px;
            }
            .chat-input input {
                flex: 1;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 4px;
            }
            .chat-input button {
                margin: 0;
            }
            .model-info {
                font-size: 12px;
                color: #666;
                margin-bottom: 10px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="stream-section">
                <h1>Live Browser Stream</h1>
                <img id="streamImg" src="/stream" alt="Live Browser Stream" />
                <div class="controls">
                    <button onclick="switchStream('/stream')">Standard Stream (20 FPS)</button>
                    <button onclick="switchStream('/stream-fast')">Fast Stream (30 FPS)</button>
                    <button onclick="location.reload()">Refresh Page</button>
                    <button onclick="window.open('/screenshot', '_blank')">Single Screenshot</button>
                </div>
                <p>
                    <strong>Stream URL:</strong> <code id="currentStream">/stream</code><br>
                    <strong>Screenshot URL:</strong> <code>/screenshot</code><br>
                    <strong>Fast Stream URL:</strong> <code>/stream-fast</code>
                </p>
            </div>
            
            <div class="chat-section">
                <h2>AI Chat</h2>
                <div class="model-info">
                    Model: IBM Granite 3.3 8B (Ollama) - WebSocket Streaming
                    <br>
                    <span id="connectionStatus" style="font-size: 10px; color: #666;">Connecting...</span>
                </div>
                <div class="chat-messages" id="chatMessages"></div>
                <div class="chat-input">
                    <input type="text" id="messageInput" placeholder="Type your message..." onkeypress="handleKeyPress(event)">
                    <button onclick="sendMessage()" id="sendButton">Send</button>
                </div>
            </div>
        </div>

        <script>
            let ws = null;
            let currentAIMessage = '';
            let isConnected = false;
            
            // Initialize WebSocket connection
            function initWebSocket() {
                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                const wsUrl = `${protocol}//${window.location.host}/ws/chat`;
                
                ws = new WebSocket(wsUrl);
                
                ws.onopen = function(event) {
                    console.log('WebSocket connected');
                    isConnected = true;
                    updateConnectionStatus('Connected - Ready for real-time chat!', '#28a745');
                    document.getElementById('sendButton').disabled = false;
                };
                
                ws.onmessage = function(event) {
                    const data = JSON.parse(event.data);
                    
                    switch(data.type) {
                        case 'start':
                            currentAIMessage = '';
                            createNewAIMessage();
                            break;
                            
                        case 'token':
                            currentAIMessage += data.content;
                            updateCurrentAIMessage(currentAIMessage);
                            
                            if (data.done) {
                                console.log('Response complete');
                            }
                            break;
                            
                        case 'complete':
                            console.log('Chat response completed');
                            break;
                            
                        case 'error':
                            addMessage(`Error: ${data.message}`, false);
                            break;
                            
                        case 'info':
                            console.log('Info:', data.message);
                            break;
                    }
                };
                
                ws.onclose = function(event) {
                    console.log('WebSocket disconnected');
                    isConnected = false;
                    updateConnectionStatus('Disconnected - Attempting to reconnect...', '#dc3545');
                    document.getElementById('sendButton').disabled = true;
                    
                    // Attempt to reconnect after 3 seconds
                    setTimeout(initWebSocket, 3000);
                };
                
                ws.onerror = function(error) {
                    console.error('WebSocket error:', error);
                    updateConnectionStatus('Connection error', '#dc3545');
                };
            }
            
            function updateConnectionStatus(message, color) {
                const statusElement = document.getElementById('connectionStatus');
                statusElement.textContent = message;
                statusElement.style.color = color;
            }
            
            function switchStream(streamUrl) {
                const img = document.getElementById('streamImg');
                const currentStreamLabel = document.getElementById('currentStream');
                img.src = streamUrl;
                currentStreamLabel.textContent = streamUrl;
            }
            
            function addMessage(content, isUser) {
                const messagesDiv = document.getElementById('chatMessages');
                const messageDiv = document.createElement('div');
                messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
                messageDiv.textContent = content;
                messagesDiv.appendChild(messageDiv);
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
                return messageDiv;
            }
            
            function createNewAIMessage() {
                const messagesDiv = document.getElementById('chatMessages');
                const messageDiv = document.createElement('div');
                messageDiv.className = 'message ai-message';
                messageDiv.textContent = '';
                messageDiv.id = 'current-ai-message';
                messagesDiv.appendChild(messageDiv);
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
                return messageDiv;
            }
            
            function updateCurrentAIMessage(content) {
                const currentMessage = document.getElementById('current-ai-message');
                if (currentMessage) {
                    currentMessage.textContent = content;
                    currentMessage.parentElement.scrollTop = currentMessage.parentElement.scrollHeight;
                }
            }
            
            function sendMessage() {
                const input = document.getElementById('messageInput');
                const message = input.value.trim();
                if (!message || !isConnected) return;
                
                addMessage(message, true);
                input.value = '';
                
                // Remove the ID from any previous AI message
                const previousAIMessage = document.getElementById('current-ai-message');
                if (previousAIMessage) {
                    previousAIMessage.removeAttribute('id');
                }
                
                // Send message via WebSocket
                ws.send(JSON.stringify({
                    message: message,
                    system_prompt: "You are a helpful AI assistant."
                }));
            }
            
            function handleKeyPress(event) {
                if (event.key === 'Enter') {
                    sendMessage();
                }
            }
            
            // Initialize WebSocket connection when page loads
            window.onload = function() {
                initWebSocket();
                document.getElementById('sendButton').disabled = true;
            };
        </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

@app.get("/stream")
async def get_mjpeg_stream():
    """Serve MJPEG stream"""
    return StreamingResponse(
        generate_mjpeg_stream(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@app.get("/screenshot")
async def get_screenshot():
    """Get a single screenshot (original endpoint)"""
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto("https://tympanus.net/Development/AmbientCanvasBackgrounds/index2.html")
        screenshot = await page.screenshot()
        await browser.close()
    return Response(content=screenshot, media_type="image/png")

@app.get("/stream-fast")
async def get_mjpeg_stream_fast():
    """Serve high-performance MJPEG stream with even more optimizations"""
    async def generate_fast_stream():
        await init_browser()

        try:
            frame_count = 0
            start_time = asyncio.get_event_loop().time()

            while True:
                frame_start = asyncio.get_event_loop().time()

                async with browser_lock:
                    if page_instance:
                        try:
                            # Ultra-optimized screenshot
                            screenshot = await page_instance.screenshot(
                                type='jpeg',
                                quality=60,  # Lower quality for speed
                                full_page=False
                            )

                            frame = (
                                b'--frame\r\n'
                                b'Content-Type: image/jpeg\r\n\r\n' +
                                screenshot +
                                b'\r\n'
                            )
                            yield frame

                            frame_count += 1

                            # Log performance every 100 frames
                            if frame_count % 100 == 0:
                                elapsed = asyncio.get_event_loop().time() - start_time
                                fps = frame_count / elapsed
                                print(f"Average FPS: {fps:.1f}")

                        except Exception as e:
                            print(f"Error taking screenshot: {e}")
                            break

                # Target 30 FPS for ultra-smooth streaming
                elapsed = asyncio.get_event_loop().time() - frame_start
                target_fps = 30
                frame_time = 1.0 / target_fps
                sleep_time = max(0, frame_time - elapsed)

                if sleep_time > 0:
                    await asyncio.sleep(sleep_time)

        except Exception as e:
            print(f"Fast stream error: {e}")
            await cleanup_browser()

    return StreamingResponse(
        generate_fast_stream(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

# Chat models and request/response schemas
class ChatRequest(BaseModel):
    message: str
    system_prompt: str = "You are a helpful AI assistant."

class ChatResponse(BaseModel):
    response: str
    model: str

# Initialize the chat model
llm = ChatModel.from_name("ollama:granite3.3:8b")

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    """Simple chat endpoint with Granite 3.3 8B model"""
    try:
        # Create a simple chat workflow
        workflow = AgentWorkflow(name="Chat Assistant")
        
        workflow.add_agent(
            name="Assistant",
            role="A helpful AI assistant",
            instructions=request.system_prompt,
            llm=llm,
        )
        
        # Run the chat workflow
        response = await workflow.run(
            inputs=[
                AgentWorkflowInput(
                    prompt=request.message,
                    expected_output="A helpful and accurate response to the user's question or request."
                )
            ]
        )
        
        return ChatResponse(
            response=response.result.final_answer,
            model="ollama:granite3.3:8b"
        )
    
    except Exception as e:
        return ChatResponse(
            response=f"Error: {str(e)}",
            model="ollama:granite3.3:8b"
        )

@app.post("/chat/stream")
async def chat_stream_endpoint(request: ChatRequest):
    """Streaming chat endpoint for real-time responses"""
    async def generate_chat_stream():
        try:
            workflow = AgentWorkflow(name="Streaming Chat Assistant")
            
            workflow.add_agent(
                name="Assistant",
                role="A helpful AI assistant",
                instructions=request.system_prompt,
                llm=llm,
            )
            
            # For streaming, we'll simulate token-by-token response
            # Note: This is a simplified version - BeeAI may have built-in streaming support
            response = await workflow.run(
                inputs=[
                    AgentWorkflowInput(
                        prompt=request.message,
                        expected_output="A helpful and accurate response to the user's question or request."
                    )
                ]
            )
            
            # Simulate streaming by yielding chunks of the response
            full_response = response.result.final_answer
            words = full_response.split()
            
            for i, word in enumerate(words):
                chunk_data = {
                    "token": word + (" " if i < len(words) - 1 else ""),
                    "done": i == len(words) - 1
                }
                # Proper SSE format
                yield f"data: {chunk_data}\n\n"
                await asyncio.sleep(0.05)  # Small delay for streaming effect
                
        except Exception as e:
            error_chunk = {
                "token": f"Error: {str(e)}",
                "done": True
            }
            yield f"data: {error_chunk}\n\n"
    
    return StreamingResponse(
        generate_chat_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )

@app.websocket("/ws/markdown_agent")
async def websocket_markdown_agent(websocket: WebSocket):
    """WebSocket endpoint for real-time Markdown agent interaction with streaming"""
    await websocket.accept()
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            user_message = message_data.get("message", "")
            system_prompt = (
                """
                You are a live markdown meeting note assistant that generates live and concise notes as the events get unfolded to provide the user live context about the current meeting so you need to make sure your notes emcompasses everything with as much less words as possible.\n
                In fact, you are not receiving a full transcript, you are receiving a list of recent transcripts and current meeting notes, so you need to make sure your notes emcompasses everything with less than 100 words as possible, atmost 150\n
                Do not add any place holders, and do not explain. Summary for keypoint should be less than 10 words,
                You will receive two types of content from the user: Transcription List and Current Meeting Markdown\n
                    Instructions:\n
                    1. Analyze the recent transcript and current notes\n
                    2. Update the meeting notes to incorporate new information from the transcript and keep it concise ideally just with tit\n
                    3. Maintain the existing structure and formatting\n
                    4. Add new key points, decisions, or action items as needed\n
                    5. Update the timestamp at the bottom\n
                    6. Keep the notes professional and concise, don't make too much changes if there's already an existing markdown structure, just update the part that needs to be updated\n
                    7. Return ONLY the updated notes in markdown format, no explanations\n

                    It should be very concise and to the point, you should not make it too long, just update the part that needs to be updated, do not make too much changes if there's already an existing markdown structure, just update the part that needs to be updated\n
                    Follow this structure:
                    # Meeting Notes\n

                    Timestamp: 2022-01-01 10:00 AM\n
                    The current status of the meeting application is under review. While it functions currently, there are concerns about its reliability and stability that need to be addressed. \n

                    ## Action Items:\n
                    - Investigate further into the functionality and reliability issues of the meeting application.\n
                    You must ensure the notes is concise and less than 100 words, atmost 150 words, and you should not make too much changes if there's already an existing markdown structure, just update the part that needs to be updated\n

                    These are the two types of content you will receive:\n
                    {user_message}\n
                """
                           )
            
            if not user_message:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "No message provided"
                }))
                continue
            
            try:
                # Try direct Ollama streaming first for real-time markdown generation
                ollama_payload = {
                    "model": "granite3.3:8b",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_message}
                    ],
                    "stream": True
                }
                
                async with aiohttp.ClientSession() as session:
                    try:
                        async with session.post(
                            "http://localhost:11434/api/chat",
                            json=ollama_payload,
                            headers={"Content-Type": "application/json"}
                        ) as response:
                            if response.status == 200:
                                # Send start signal
                                await websocket.send_text(json.dumps({
                                    "type": "start",
                                    "message": "Starting markdown generation..."
                                }))
                                
                                async for line in response.content:
                                    if line:
                                        try:
                                            # Parse each JSON line from Ollama stream
                                            ollama_data = json.loads(line.decode('utf-8'))
                                            
                                            if 'message' in ollama_data and 'content' in ollama_data['message']:
                                                token = ollama_data['message']['content']
                                                is_done = ollama_data.get('done', False)
                                                
                                                if token:
                                                    # Send token immediately via WebSocket
                                                    await websocket.send_text(json.dumps({
                                                        "type": "token",
                                                        "content": token,
                                                        "done": is_done,
                                                        "model": "ollama:granite3.3:8b"
                                                    }))
                                                
                                                if is_done:
                                                    await websocket.send_text(json.dumps({
                                                        "type": "complete",
                                                        "message": "Markdown generation complete"
                                                    }))
                                                    break
                                                    
                                        except json.JSONDecodeError:
                                            continue
                            else:
                                raise Exception(f"Ollama API returned status {response.status}")
                                
                    except Exception as ollama_error:
                        # Fallback to BeeAI workflow with streaming
                        await websocket.send_text(json.dumps({
                            "type": "info",
                            "message": "Using BeeAI workflow for markdown generation..."
                        }))
                        
                        workflow = AgentWorkflow(name="Streaming Markdown Agent")
                        
                        workflow.add_agent(
                            name="Markdown Assistant",
                            role="You are a helpful meeting note assistant that takes notes as the event unfolds",
                            instructions=system_prompt,
                            llm=llm,
                        )
                        
                        # Run the workflow
                        response = await workflow.run(
                            inputs=[
                                AgentWorkflowInput(
                                    prompt=user_message,
                                    expected_output=("\\n<GOTO>\\n - generates this first with them on a separate line. This command would move the cursor to that particular line. Signifies the end with </GOTO>\n"
                                                   "\\n```\\n - always makes sure to wrap the content inside the three backticks to indicate a code block which will be used by the actual editor to add your content. Signifies the end also with it\n")
                                )
                            ]
                        )
                        
                        # Stream the response character by character for real-time effect
                        full_response = response.result.final_answer
                        current_chunk = ""
                        
                        # Send start signal for BeeAI fallback
                        await websocket.send_text(json.dumps({
                            "type": "start",
                            "message": "Starting markdown generation..."
                        }))
                        
                        for i, char in enumerate(full_response):
                            current_chunk += char
                            
                            # Send token on word boundaries or special markdown characters
                            if char in [' ', '.', ',', '!', '?', '\n', ';', ':', '`', '#', '*', '-', '>', '|'] or i == len(full_response) - 1:
                                await websocket.send_text(json.dumps({
                                    "type": "token",
                                    "content": current_chunk,
                                    "done": i == len(full_response) - 1,
                                    "model": "ollama:granite3.3:8b"
                                }))
                                current_chunk = ""
                                await asyncio.sleep(0.01)  # Very fast streaming for markdown
                        
                        await websocket.send_text(json.dumps({
                            "type": "complete",
                            "message": "Markdown generation complete"
                        }))
                        
            except Exception as e:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": f"Error: {str(e)}"
                }))
                
    except WebSocketDisconnect:
        print("Markdown agent WebSocket client disconnected")
    except Exception as e:
        print(f"Markdown agent WebSocket error: {e}")
        try:
            await websocket.send_text(json.dumps({
                "type": "error",
                "message": f"WebSocket error: {str(e)}"
            }))
        except:
            pass

@app.websocket("/ws/chat")
async def websocket_chat_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time chat streaming"""
    await websocket.accept()
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            user_message = message_data.get("message", "")
            system_prompt = message_data.get("system_prompt", "You are a helpful AI assistant.")
            
            if not user_message:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "No message provided"
                }))
                continue
            
            try:
                # Try direct Ollama streaming first
                ollama_payload = {
                    "model": "granite3.3:8b",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_message}
                    ],
                    "stream": True
                }
                
                async with aiohttp.ClientSession() as session:
                    try:
                        async with session.post(
                            "http://localhost:11434/api/chat",
                            json=ollama_payload,
                            headers={"Content-Type": "application/json"}
                        ) as response:
                            if response.status == 200:
                                # Send start signal
                                await websocket.send_text(json.dumps({
                                    "type": "start",
                                    "message": "Starting response..."
                                }))
                                
                                async for line in response.content:
                                    if line:
                                        try:
                                            # Parse each JSON line from Ollama stream
                                            ollama_data = json.loads(line.decode('utf-8'))
                                            
                                            if 'message' in ollama_data and 'content' in ollama_data['message']:
                                                token = ollama_data['message']['content']
                                                is_done = ollama_data.get('done', False)
                                                
                                                if token:
                                                    # Send token immediately via WebSocket
                                                    await websocket.send_text(json.dumps({
                                                        "type": "token",
                                                        "content": token,
                                                        "done": is_done
                                                    }))
                                                
                                                if is_done:
                                                    await websocket.send_text(json.dumps({
                                                        "type": "complete",
                                                        "message": "Response complete"
                                                    }))
                                                    break
                                                    
                                        except json.JSONDecodeError:
                                            continue
                            else:
                                raise Exception(f"Ollama API returned status {response.status}")
                                
                    except Exception as ollama_error:
                        # Fallback to BeeAI workflow
                        await websocket.send_text(json.dumps({
                            "type": "info",
                            "message": "Using BeeAI workflow..."
                        }))
                        
                        workflow = AgentWorkflow(name="WebSocket Chat Assistant")
                        
                        workflow.add_agent(
                            name="Assistant",
                            role="A helpful AI assistant",
                            instructions=system_prompt,
                            llm=llm,
                        )
                        
                        # Run the workflow
                        response = await workflow.run(
                            inputs=[
                                AgentWorkflowInput(
                                    prompt=user_message,
                                    expected_output="A helpful and accurate response to the user's question or request."
                                )
                            ]
                        )
                        
                        # Stream the response character by character for real-time effect
                        full_response = response.result.final_answer
                        current_word = ""
                        
                        for i, char in enumerate(full_response):
                            current_word += char
                            
                            # Send token on word boundaries or end of text
                            if char in [' ', '.', ',', '!', '?', '\n', ';', ':'] or i == len(full_response) - 1:
                                await websocket.send_text(json.dumps({
                                    "type": "token",
                                    "content": current_word,
                                    "done": i == len(full_response) - 1
                                }))
                                current_word = ""
                                await asyncio.sleep(0.02)  # Small delay for streaming effect
                        
                        await websocket.send_text(json.dumps({
                            "type": "complete",
                            "message": "Response complete"
                        }))
                        
            except Exception as e:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": f"Error: {str(e)}"
                }))
                
    except WebSocketDisconnect:
        print("WebSocket client disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")
        try:
            await websocket.send_text(json.dumps({
                "type": "error",
                "message": f"WebSocket error: {str(e)}"
            }))
        except:
            pass

@app.get("/chat/models")
async def get_available_models():
    """Get list of available chat models"""
    return {
        "models": [
            {
                "name": "granite3.3:8b",
                "full_name": "ollama:granite3.3:8b",
                "description": "IBM Granite 3.3 8B parameter model running on Ollama",
                "type": "chat"
            }
        ],
        "current_model": "ollama:granite3.3:8b"
    }

@app.get("/chat/test")
async def test_chat():
    """Test endpoint to verify the chat functionality"""
    try:
        workflow = AgentWorkflow(name="Test Assistant")
        
        workflow.add_agent(
            name="Tester",
            role="A test assistant",
            instructions="You are a helpful assistant for testing purposes.",
            llm=llm,
        )
        
        response = await workflow.run(
            inputs=[
                AgentWorkflowInput(
                    prompt="Say hello and confirm you are working correctly.",
                    expected_output="A friendly greeting and confirmation message."
                )
            ]
        )
        
        return {
            "status": "success",
            "message": response.result.final_answer,
            "model": "ollama:granite3.3:8b"
        }
    
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "model": "ollama:granite3.3:8b"
        }

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown"""
    await cleanup_browser()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
