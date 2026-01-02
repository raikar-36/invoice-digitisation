"""
Invoice OCR Processing Service - Native Google Gemini SDK
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
from PIL import Image

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

gemini_model = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global gemini_model

    print("=" * 70)
    print("Invoice OCR Service Starting (Native Gemini SDK)")
    print("=" * 70)

    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("OPENAI_API_KEY")
    model_name = os.getenv("GEMINI_MODEL", "gemini-2.0-flash-exp")

    if PDF_SUPPORT:
        print("PDF Support: Enabled")
    else:
        print("PDF Support: Disabled (install poppler)")

    if not api_key or "your_" in api_key.lower():
        print("ERROR: GEMINI_API_KEY not set or using placeholder")
        print("Get your key at: https://aistudio.google.com/apikey")
        gemini_model = None
    else:
        try:
            genai.configure(api_key=api_key)
            gemini_model = genai.GenerativeModel(model_name)
            print(f"Gemini API: Connected")
            print(f"Model: {model_name}")
        except Exception as e:
            print(f"Gemini API: Failed to initialize - {e}")
            gemini_model = None

    print("=" * 70)
    print(f"Server ready at http://localhost:8000")
    print(f"API docs at http://localhost:8000/docs")
    print("=" * 70)

    yield

    gemini_model = None
    print("Service shutdown complete")


app = FastAPI(
    title="Invoice OCR API (Native Gemini)",
    description="Invoice OCR powered by Google Gemini (Native SDK)",
    version="1.0.0",
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


async def process_single_image(image_path: str) -> Dict[str, Any]:
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
    return {
        "status": "healthy",
        "api_connected": gemini_model is not None,
        "provider": "Google Gemini (Native SDK)",
        "pdf_enabled": PDF_SUPPORT,
        "supported_formats": ["jpg", "jpeg", "png", "bmp", "webp"] + 
                           (["pdf"] if PDF_SUPPORT else [])
    }


@app.post("/api/v1/process-invoice", response_model=InvoiceResponse)
async def process_invoice(
    files: List[UploadFile] = File(..., description="Upload PDF or image files")
):
    if not files:
        raise HTTPException(400, "No files uploaded")

    if not gemini_model:
        raise HTTPException(
            503,
            "Gemini API not available. Set GEMINI_API_KEY or OPENAI_API_KEY in .env"
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

        print(f"Processing {len(image_paths)} image(s) with Gemini...")

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
        
        print("Processing complete")
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
