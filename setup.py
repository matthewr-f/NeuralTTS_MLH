#!/usr/bin/env python3
"""
Setup script for TTS PDF Reader
Installs dependencies and provides setup instructions
"""

import subprocess
import sys
import os

def install_requirements():
    """Install required Python packages"""
    try:
        print("📦 Installing Python dependencies...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Dependencies installed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing dependencies: {e}")
        return False

def check_api_key():
    """Check if API key is configured"""
    api_key = os.getenv('GOOGLE_CLOUD_API_KEY')
    if api_key:
        print("✅ Google Cloud API key is configured")
        return True
    else:
        print("⚠️  Google Cloud API key not found in environment variables")
        print("   Please set it with: export GOOGLE_CLOUD_API_KEY='your-api-key-here'")
        return False

def main():
    print("🚀 TTS PDF Reader Setup")
    print("=" * 40)
    
    # Install dependencies
    if not install_requirements():
        print("\n❌ Setup failed. Please install dependencies manually:")
        print("   pip install -r requirements.txt")
        return
    
    # Check API key
    api_configured = check_api_key()
    
    print("\n" + "=" * 40)
    if api_configured:
        print("🎉 Setup complete! You can now run:")
        print("   python server.py")
    else:
        print("🔧 Setup almost complete! Please configure your API key:")
        print("   export GOOGLE_CLOUD_API_KEY='your-api-key-here'")
        print("   Then run: python server.py")

if __name__ == "__main__":
    main()
