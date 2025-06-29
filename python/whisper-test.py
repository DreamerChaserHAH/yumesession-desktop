#!/usr/bin/env python3
"""
Fast On-Device Speech-to-Text with OpenAI Whisper
================================================

Much lighter and faster than Granite Speech for on-device transcription.

Models (from smallest to largest):
- tiny: ~39 MB, ~32x faster
- base: ~74 MB, ~16x faster  
- small: ~244 MB, ~6x faster
- medium: ~769 MB, ~2x faster
- large: ~1550 MB, best quality
"""

import whisper
import torch
import time
import torchaudio

# Check device - use CPU for Whisper due to MPS compatibility issues
device = "cpu"  # Whisper works best on CPU for now
print(f"🖥️  Using device: {device} (CPU is fastest for Whisper)")

# Load Whisper model - start with 'base' for good speed/quality balance
print("📥 Loading Whisper model...")
start_time = time.time()

# Choose model size based on your needs:
# - "tiny": Fastest, least accurate (~1-2 seconds per audio chunk)
# - "base": Good balance (~2-3 seconds per audio chunk) 
# - "small": Better accuracy (~3-5 seconds per audio chunk)
model = whisper.load_model("base", device=device)

print(f"✅ Model loaded in {time.time() - start_time:.2f} seconds")

# Test with a sample audio file
def test_transcription():
    print("\n🎵 Testing transcription...")
    
    # You can use any audio file here
    # For testing, let's create a simple test or use existing audio
    try:
        # Test with the Granite sample audio if available
        from huggingface_hub import hf_hub_download
        audio_path = hf_hub_download(repo_id="ibm-granite/granite-speech-3.3-8b", filename='10226_10111_000000.wav')
        print(f"📁 Using sample audio: {audio_path}")
    except:
        print("❌ Sample audio not found. Please provide an audio file path.")
        return
    
    # Transcribe
    print("🔄 Transcribing...")
    inference_start = time.time()
    
    result = model.transcribe(audio_path)
    
    inference_time = time.time() - inference_start
    print(f"⚡ Transcription completed in {inference_time:.2f} seconds")
    print(f"📝 Text: {result['text']}")
    
    # Show detected language
    print(f"🌍 Detected language: {result['language']}")

def test_different_models():
    """Test different Whisper model sizes"""
    models = ["tiny", "base", "small"]
    
    for model_name in models:
        print(f"\n🧪 Testing {model_name} model...")
        start = time.time()
        test_model = whisper.load_model(model_name, device=device)
        load_time = time.time() - start
        print(f"   📥 Load time: {load_time:.2f}s")
        
        # Get model size
        param_count = sum(p.numel() for p in test_model.parameters())
        print(f"   📊 Parameters: {param_count/1e6:.1f}M")

if __name__ == "__main__":
    test_transcription()
    
    # Uncomment to test all model sizes
    # test_different_models()
