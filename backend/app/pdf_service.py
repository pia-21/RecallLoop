from io import BytesIO

from fastapi import HTTPException, UploadFile
from pypdf import PdfReader


async def extract_pdf_text(file: UploadFile) -> str:
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported.",
        )

    content = await file.read()

    if not content:
        raise HTTPException(
            status_code=400,
            detail="The uploaded PDF is empty.",
        )

    try:
        reader = PdfReader(BytesIO(content))
        extracted_text = "\n".join(
            page.extract_text() or "" for page in reader.pages
        ).strip()

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Unable to read this PDF.",
        )

    if not extracted_text:
        raise HTTPException(
            status_code=400,
            detail="No readable text found. Please upload a text-based PDF.",
        )

    return extracted_text