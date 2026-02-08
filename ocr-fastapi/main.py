"""
Invoice OCR Processing Service - Multi-Provider (Gemini & Grok)
"""

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, UploadFile, File, HTTPException
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
import tempfile
import os
from pathlib import Path
import asyncio
import json
from contextlib import asynccontextmanager
import google.generativeai as genai
from openai import OpenAI
import base64
from PIL import Image
import time

try:
    from pdf2image import convert_from_path
    PDF_SUPPORT = True
except Exception:
    convert_from_path = None
    PDF_SUPPORT = False


class LineItem(BaseModel):
    item_name: str
    item_description: Optional[str] = None
    item_quantity: Optional[float] = None
    item_price: Optional[float] = None
    item_tax_percentage: Optional[float] = None
    item_total: Optional[float] = None


class InvoiceResponse(BaseModel):
    customer_name: Optional[str] = None
    customer_address: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    customer_gstin: Optional[str] = None

    invoice_number: Optional[str] = None
    invoice_date: Optional[str] = None

    total_amount: Optional[float] = None
    tax_amount: Optional[float] = None
    discount_amount: Optional[float] = None
    currency: str = "INR"

    line_items: List[LineItem] = Field(default_factory=list)
    
    processing_time_seconds: Optional[float] = None

# Global model instances
gemini_model = None
groq_client = None
ocr_mode = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global gemini_model, groq_client, ocr_mode

    print("=" * 70)
    print("Invoice OCR Service Starting (Multi-Provider)")
    print("=" * 70)

    # Get OCR mode from environment
    ocr_mode = os.getenv("OCR_MODE", "gemini").lower()
    
    if PDF_SUPPORT:
        print("PDF Support: Enabled")
    else:
        print("PDF Support: Disabled (install poppler)")

    print(f"OCR Mode: {ocr_mode.upper()}")
    print("-" * 70)

    # Initialize based on mode
    if ocr_mode == "groq":
        # Initialize Groq
        groq_api_key = os.getenv("GROQ_API_KEY")
        groq_model = os.getenv("GROQ_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct")
        
        if not groq_api_key or "your_" in groq_api_key.lower():
            print("ERROR: GROQ_API_KEY not set or using placeholder")
            print("Get your key at: https://console.groq.com/keys")
            groq_client = None
        else:
            try:
                groq_client = OpenAI(
                    api_key=groq_api_key,
                    base_url="https://api.groq.com/openai/v1"
                )
                print(f"Groq API: Connected")
                print(f"Model: {groq_model}")
            except Exception as e:
                print(f"Groq API: Failed to initialize - {e}")
                groq_client = None
    
    elif ocr_mode == "gemini":
        # Initialize Gemini
        gemini_api_key = os.getenv("GEMINI_API_KEY") or os.getenv("OPENAI_API_KEY")
        gemini_model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        
        if not gemini_api_key or "your_" in gemini_api_key.lower():
            print("ERROR: GEMINI_API_KEY not set or using placeholder")
            print("Get your key at: https://aistudio.google.com/apikey")
            gemini_model = None
        else:
            try:
                genai.configure(api_key=gemini_api_key)
                gemini_model = genai.GenerativeModel(gemini_model_name)
                print(f"Gemini API: Connected")
                print(f"Model: {gemini_model_name}")
            except Exception as e:
                print(f"Gemini API: Failed to initialize - {e}")
                gemini_model = None
    
    else:
        print(f"ERROR: Invalid OCR_MODE '{ocr_mode}'. Use 'gemini' or 'groq'")

    print("=" * 70)
    print(f"Server ready at http://localhost:8000")
    print(f"API docs at http://localhost:8000/docs")
    print("=" * 70)

    yield

    gemini_model = None
    groq_client = None
    print("Service shutdown complete")


app = FastAPI(
    title="Invoice OCR API (Multi-Provider)",
    description="Invoice OCR powered by Google Gemini or Groq",
    version="2.0.0",
    lifespan=lifespan
)


def is_pdf(filename: str) -> bool:
    return filename.lower().endswith(".pdf")


def is_image(filename: str) -> bool:
    return Path(filename).suffix.lower() in {
        ".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".webp"
    }


async def pdf_to_images(pdf_path: str, dpi: int = 300) -> List[str]:
    if not PDF_SUPPORT:
        raise HTTPException(
            503,
            "PDF support not available. Install poppler system package."
        )
    
    temp_dir = tempfile.mkdtemp()
    
    try:
        images = convert_from_path(pdf_path, dpi=dpi)
    except Exception as e:
        raise HTTPException(500, f"Failed to convert PDF: {str(e)}")

    paths = []
    for i, img in enumerate(images):
        p = os.path.join(temp_dir, f"page_{i}.jpg")
        img.save(p, "JPEG")
        paths.append(p)

    return paths


def encode_image_base64(image_path: str) -> str:
    """Encode image to base64 for Groq API"""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')


async def process_single_image_groq(image_path: str) -> Dict[str, Any]:
    """Process image using Groq API"""
    if not groq_client:
        return {}

    try:
        # Encode image to base64
        base64_image = encode_image_base64(image_path)
        
        # Determine image format
        ext = Path(image_path).suffix.lower()
        mime_type = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.webp': 'image/webp'
        }.get(ext, 'image/jpeg')
        
        prompt = '''Extract invoice data and return ONLY valid JSON with this exact structure:

{
  "customer_name": "string or null",
  "customer_address": "string or null",
  "customer_phone": "string or null",
  "customer_email": "string or null",
  "customer_gstin": "string or null",
  "invoice_number": "string or null",
  "invoice_date": "string or null",
  "total_amount": number or null,
  "tax_amount": number or null,
  "discount_amount": number or null,
  "currency": "string or null",
  "line_items": [
    {
      "item_name": "string",
      "item_description": "string or null",
      "item_quantity": number or null,
      "item_price": number or null,
      "item_tax_percentage": number or null,
      "item_total": number or null
    }
  ]
}

If a field is not present, use null.
Return ONLY the JSON.'''

        groq_model = os.getenv("GROQ_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct")
        
        response = groq_client.chat.completions.create(
            model=groq_model,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{mime_type};base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            temperature=0.0
        )
        
        content = response.choices[0].message.content
        
        # Clean up response
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
        
        content = content.strip()
        
        print(f"Full Groq response ({len(content)} chars):")
        print(content)
        print("=" * 50)
        
        result = json.loads(content)
        print(f"Extracted from {Path(image_path).name}")
        return result
        
    except json.JSONDecodeError as e:
        print(f"JSON parse error for {image_path}: {e}")
        print(f"Full response ({len(content)} chars):")
        print(content)
        print(f"Character at error position: {repr(content[e.pos-5:e.pos+5]) if e.pos < len(content) else 'N/A'}")
        return {}
    except Exception as e:
        print(f"Error processing {image_path}: {e}")
        import traceback
        traceback.print_exc()
        return {}


async def process_single_image_gemini(image_path: str) -> Dict[str, Any]:
    """Process image using Gemini API"""
    if not gemini_model:
        return {}

    try:
        img = Image.open(image_path)
        
        prompt = '''Extract invoice data and return ONLY valid JSON with this exact structure:

{
  "customer_name": "string or null",
  "customer_address": "string or null",
  "customer_phone": "string or null",
  "customer_email": "string or null",
  "customer_gstin": "string or null",
  "invoice_number": "string or null",
  "invoice_date": "string or null",
  "total_amount": number or null,
  "tax_amount": number or null,
  "discount_amount": number or null,
  "currency": "string or null",
  "line_items": [
    {
      "item_name": "string",
      "item_description": "string or null",
      "item_quantity": number or null,
      "item_price": number or null,
      "item_tax_percentage": number or null,
      "item_total": number or null
    }
  ]
}

If a field is not present, use null.
Return ONLY the JSON.
'''

        response = gemini_model.generate_content([prompt, img])
        content = response.text
        
        if "`json" in content:
            content = content.split("`json")[1].split("`")[0].strip()
        elif "`" in content:
            content = content.split("`")[1].split("`")[0].strip()
        
        content = content.strip()
        
        print(f"Full Gemini response ({len(content)} chars):")
        print(content)
        print("=" * 50)
        
        result = json.loads(content)
        print(f"Extracted from {Path(image_path).name}")
        return result
        
    except json.JSONDecodeError as e:
        print(f"JSON parse error for {image_path}: {e}")
        print(f"Full response ({len(content)} chars):")
        print(content)
        print(f"Character at error position: {repr(content[e.pos-5:e.pos+5]) if e.pos < len(content) else 'N/A'}")
        return {}
    except Exception as e:
        print(f"Error processing {image_path}: {e}")
        return {}


async def process_single_image(image_path: str) -> Dict[str, Any]:
    """Route to appropriate OCR provider based on mode"""
    if ocr_mode == "groq":
        return await process_single_image_groq(image_path)
    elif ocr_mode == "gemini":
        return await process_single_image_gemini(image_path)
    else:
        print(f"Invalid OCR mode: {ocr_mode}")
        return {}


def merge_invoice_data(results: List[Dict[str, Any]]) -> Dict[str, Any]:
    if not results:
        return {
            "customer_name": None,
            "customer_address": None,
            "customer_phone": None,
            "customer_email": None,
            "customer_gstin": None,
            "invoice_number": None,
            "invoice_date": None,
            "total_amount": None,
            "tax_amount": None,
            "discount_amount": None,
            "currency": "INR",
            "line_items": []
        }

    if len(results) == 1:
        result = results[0].copy()
        if not result.get("currency"):
            result["currency"] = "INR"
        return result

    merged = {
        "customer_name": None,
        "customer_address": None,
        "customer_phone": None,
        "customer_email": None,
        "customer_gstin": None,
        "invoice_number": None,
        "invoice_date": None,
        "total_amount": 0.0,
        "tax_amount": 0.0,
        "discount_amount": 0.0,
        "currency": "INR",
        "line_items": []
    }

    currencies = []

    for r in results:
        for k in [
            "customer_name",
            "customer_address",
            "customer_phone",
            "customer_email",
            "customer_gstin",
            "invoice_number",
            "invoice_date"
        ]:
            if not merged[k] and r.get(k):
                merged[k] = r[k]

        for k in ["total_amount", "tax_amount", "discount_amount"]:
            if r.get(k) is not None:
                merged[k] += float(r[k])

        if r.get("currency"):
            currencies.append(r["currency"])

        if r.get("line_items"):
            merged["line_items"].extend(r["line_items"])

    if currencies:
        merged["currency"] = max(set(currencies), key=currencies.count)

    return merged


async def cleanup(paths: List[str]):
    for p in paths:
        try:
            if os.path.exists(p):
                os.remove(p)
                try:
                    parent = os.path.dirname(p)
                    if parent and os.path.exists(parent):
                        os.rmdir(parent)
                except Exception:
                    pass
        except Exception as e:
            print(f"Cleanup warning: {e}")


@app.get("/health")
async def health():
    provider_name = "Groq" if ocr_mode == "groq" else "Google Gemini"
    api_connected = (groq_client is not None) if ocr_mode == "groq" else (gemini_model is not None)
    
    return {
        "status": "healthy",
        "ocr_mode": ocr_mode,
        "api_connected": api_connected,
        "provider": provider_name,
        "pdf_enabled": PDF_SUPPORT,
        "supported_formats": ["jpg", "jpeg", "png", "bmp", "webp"] + 
                           (["pdf"] if PDF_SUPPORT else [])
    }


@app.post("/api/v1/process-invoice", response_model=InvoiceResponse)
async def process_invoice(
    files: List[UploadFile] = File(..., description="Upload PDF or image files")
):
    start_time = time.time()
    
    if not files:
        raise HTTPException(400, "No files uploaded")

    # Check if API is available based on mode
    if ocr_mode == "groq" and not groq_client:
        raise HTTPException(
            503,
            "Groq API not available. Set GROQ_API_KEY in .env"
        )
    elif ocr_mode == "gemini" and not gemini_model:
        raise HTTPException(
            503,
            "Gemini API not available. Set GEMINI_API_KEY in .env"
        )
    elif ocr_mode not in ["groq", "gemini"]:
        raise HTTPException(
            503,
            f"Invalid OCR_MODE '{ocr_mode}'. Set OCR_MODE to 'gemini' or 'groq' in .env"
        )

    temp_files = []
    image_paths = []

    try:
        if len(files) == 1:
            f = files[0]

            with tempfile.NamedTemporaryFile(
                delete=False,
                suffix=Path(f.filename).suffix
            ) as tmp:
                tmp.write(await f.read())
                temp_files.append(tmp.name)

            if is_pdf(f.filename):
                print(f"Processing PDF: {f.filename}")
                image_paths = await pdf_to_images(tmp.name)
                temp_files.extend(image_paths)

            elif is_image(f.filename):
                print(f"Processing image: {f.filename}")
                image_paths = [tmp.name]

            else:
                raise HTTPException(
                    400,
                    f"Unsupported file type: {f.filename}"
                )

        else:
            print(f"Processing {len(files)} files")

            for f in files:
                if not is_image(f.filename):
                    raise HTTPException(
                        400,
                        f"Multiple files must all be images. Found: {f.filename}"
                    )

                with tempfile.NamedTemporaryFile(
                    delete=False,
                    suffix=Path(f.filename).suffix
                ) as tmp:
                    tmp.write(await f.read())
                    temp_files.append(tmp.name)
                    image_paths.append(tmp.name)

        provider = "Groq" if ocr_mode == "groq" else "Gemini"
        print(f"Processing {len(image_paths)} image(s) with {provider}...")

        results = await asyncio.gather(
            *[process_single_image(p) for p in image_paths]
        )

        results = [r for r in results if r]

        if not results:
            raise HTTPException(
                500,
                "Failed to extract data from any images. Check server logs for details."
            )

        print(f"Merging data from {len(results)} result(s)...")
        merged = merge_invoice_data(results)

        # Ensure currency is always a string
        if not merged.get("currency") or not isinstance(merged.get("currency"), str):
            merged["currency"] = "INR"
        
        # Convert numeric fields to proper types or None
        for field in ["total_amount", "tax_amount", "discount_amount"]:
            if merged.get(field) == 0.0 and len(results) == 1:
                # For single result, use original value (might be None)
                if results[0].get(field) is None:
                    merged[field] = None
        
        # Calculate processing time
        end_time = time.time()
        processing_time = round(end_time - start_time, 2)
        merged["processing_time_seconds"] = processing_time
        
        print(f"Processing complete in {processing_time}s")
        return InvoiceResponse(**merged)

    except HTTPException:
        raise

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Processing error: {str(e)}")

    finally:
        await cleanup(temp_files)


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
