"""
Test client for Invoice OCR Service
Usage: python test_client.py <file_path_or_directory>
"""

import requests
import sys
import os
from pathlib import Path
import json
from typing import List


API_URL = "http://localhost:8000/api/v1/process-invoice"


def test_health_check():
    """Test if service is running"""
    try:
        response = requests.get("http://localhost:8000/health")
        if response.status_code == 200:
            print("✅ Service is healthy")
            print(f"   {response.json()}")
            return True
        else:
            print(f"❌ Service health check failed: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to service. Is it running?")
        print("   Run: python main.py")
        return False


def process_single_file(file_path: str):
    """Process a single file"""
    print(f"\n{'='*70}")
    print(f"📄 Processing: {file_path}")
    print(f"{'='*70}")
    
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        return
    
    try:
        with open(file_path, "rb") as f:
            files = {"files": (os.path.basename(file_path), f)}
            response = requests.post(API_URL, files=files)
        
        if response.status_code == 200:
            result = response.json()
            print("\n✅ SUCCESS! Extracted data:")
            print(json.dumps(result, indent=2))
            
            # Summary
            print(f"\n📊 Summary:")
            print(f"   Merchant: {result.get('merchant_name', 'N/A')}")
            print(f"   Date: {result.get('transaction_date', 'N/A')}")
            print(f"   Total: {result.get('currency', '')} {result.get('total_amount', 'N/A')}")
            print(f"   Line Items: {len(result.get('line_items', []))}")
            
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"   {response.text}")
    
    except Exception as e:
        print(f"❌ Exception: {str(e)}")


def process_multiple_files(file_paths: List[str]):
    """Process multiple files at once"""
    print(f"\n{'='*70}")
    print(f"📚 Processing {len(file_paths)} files together")
    print(f"{'='*70}")
    
    for path in file_paths:
        if not os.path.exists(path):
            print(f"❌ File not found: {path}")
            return
    
    try:
        files = []
        file_handles = []
        
        # Open all files
        for path in file_paths:
            f = open(path, "rb")
            file_handles.append(f)
            files.append(("files", (os.path.basename(path), f)))
        
        # Send request
        response = requests.post(API_URL, files=files)
        
        # Close all files
        for f in file_handles:
            f.close()
        
        if response.status_code == 200:
            result = response.json()
            print("\n✅ SUCCESS! Merged data from all files:")
            print(json.dumps(result, indent=2))
            
            # Summary
            print(f"\n📊 Summary:")
            print(f"   Merchant: {result.get('merchant_name', 'N/A')}")
            print(f"   Date: {result.get('transaction_date', 'N/A')}")
            print(f"   Total: {result.get('currency', '')} {result.get('total_amount', 'N/A')}")
            print(f"   Line Items: {len(result.get('line_items', []))}")
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"   {response.text}")
    
    except Exception as e:
        print(f"❌ Exception: {str(e)}")


def process_directory(dir_path: str):
    """Process all images/PDFs in a directory"""
    print(f"\n📁 Scanning directory: {dir_path}")
    
    valid_extensions = {'.pdf', '.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp'}
    files = []
    
    for file_path in Path(dir_path).iterdir():
        if file_path.suffix.lower() in valid_extensions:
            files.append(str(file_path))
    
    if not files:
        print("❌ No valid files found in directory")
        return
    
    print(f"   Found {len(files)} file(s)")
    
    # Ask user if they want to process together or separately
    print("\nOptions:")
    print("  1. Process each file separately")
    print("  2. Process all files together (merged result)")
    
    choice = input("Choose option (1 or 2): ").strip()
    
    if choice == "2":
        process_multiple_files(files)
    else:
        for file_path in files:
            process_single_file(file_path)


def main():
    """Main function"""
    print("="*70)
    print("🧾 Invoice OCR Service - Test Client")
    print("="*70)
    
    # Health check
    if not test_health_check():
        return
    
    # Get file path from command line or prompt
    if len(sys.argv) > 1:
        path = sys.argv[1]
    else:
        path = input("\nEnter file path or directory: ").strip()
    
    if not path:
        print("❌ No path provided")
        return
    
    # Process based on input type
    if os.path.isfile(path):
        process_single_file(path)
    elif os.path.isdir(path):
        process_directory(path)
    else:
        print(f"❌ Invalid path: {path}")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 Interrupted by user")
    except Exception as e:
        print(f"\n❌ Unexpected error: {str(e)}")