# pip install fastapi uvicorn playwright
# playwright install chromium

from fastapi import FastAPI, Response, Request
from fastapi.responses import StreamingResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from playwright.async_api import async_playwright
import io
import uvicorn
import time
import asyncio
from typing import AsyncGenerator
import screeninfo

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
    """Serve a simple HTML page to view the stream"""
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Browser MJPEG Stream</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                background-color: #f0f0f0;
            }
            .container {
                max-width: 1300px;
                margin: 0 auto;
                text-align: center;
            }
            h1 {
                color: #333;
                margin-bottom: 20px;
            }
            .stream-container {
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                display: inline-block;
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
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Live Browser Stream</h1>
            <div class="stream-container">
                <img id="streamImg" src="/stream" alt="Live Browser Stream" />
            </div>
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

        <script>
            function switchStream(streamUrl) {
                const img = document.getElementById('streamImg');
                const currentStreamLabel = document.getElementById('currentStream');
                img.src = streamUrl;
                currentStreamLabel.textContent = streamUrl;
            }
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

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown"""
    await cleanup_browser()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
