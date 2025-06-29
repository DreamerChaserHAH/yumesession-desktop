#!/usr/bin/env python3
"""
Quick test to verify MPS (Metal Performance Shaders) support on Mac M4
"""
import torch

print(f"PyTorch version: {torch.__version__}")
print(f"MPS available: {torch.backends.mps.is_available()}")
print(f"MPS built: {torch.backends.mps.is_built()}")

if torch.backends.mps.is_available():
    print("✅ MPS is available!")
    
    # Test MPS performance
    print("🧪 Testing MPS performance...")
    
    # CPU test
    import time
    x_cpu = torch.randn(1000, 1000)
    y_cpu = torch.randn(1000, 1000)
    
    start = time.time()
    z_cpu = torch.mm(x_cpu, y_cpu)
    cpu_time = time.time() - start
    print(f"CPU time: {cpu_time:.4f} seconds")
    
    # MPS test
    x_mps = torch.randn(1000, 1000).to("mps")
    y_mps = torch.randn(1000, 1000).to("mps")
    
    start = time.time()
    z_mps = torch.mm(x_mps, y_mps)
    mps_time = time.time() - start
    print(f"MPS time: {mps_time:.4f} seconds")
    
    speedup = cpu_time / mps_time
    print(f"🚀 MPS speedup: {speedup:.2f}x faster than CPU")
    
else:
    print("❌ MPS not available")
    print("Make sure you have:")
    print("- macOS 12.3 or later")
    print("- PyTorch with MPS support")
