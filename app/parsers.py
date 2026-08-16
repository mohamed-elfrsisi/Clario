"""
Document parsing — converts uploaded PDF/DOCX/TXT into plain text.

Implements step 1 of FR-6/FR-9 (see Functional Spec §1.8) and the
error-handling rule: an unparseable file must raise an explicit error,
never silently return empty text (ties to NFR-2 / API spec §3.4).
"""
import io
from docx import Document as DocxDocument
import pdfplumber


class UnparseableDocumentError(Exception):
    """Raised when a file cannot be read — surfaced as a 400 by the API layer."""
    pass


def parse_document(filename: str, file_bytes: bytes) -> str:
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""

    if ext == "pdf":
        return _parse_pdf(file_bytes)
    elif ext == "docx":
        return _parse_docx(file_bytes)
    elif ext == "txt":
        return _parse_txt(file_bytes)
    else:
        raise UnparseableDocumentError(
            f"Unsupported file type '.{ext}'. Supported: .pdf, .docx, .txt"
        )


def _parse_pdf(file_bytes: bytes) -> str:
    try:
        text_parts = []
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
        text = "\n".join(text_parts).strip()
    except Exception as e:
        raise UnparseableDocumentError(f"Could not read PDF: {e}")

    if not text:
        # Likely a scanned/image-based PDF with no extractable text layer.
        raise UnparseableDocumentError(
            "No extractable text found in PDF. It may be a scanned image "
            "without a text layer — try uploading a text-based PDF or DOCX."
        )
    return text


def _parse_docx(file_bytes: bytes) -> str:
    try:
        doc = DocxDocument(io.BytesIO(file_bytes))
        text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
    except Exception as e:
        raise UnparseableDocumentError(f"Could not read DOCX: {e}")

    if not text.strip():
        raise UnparseableDocumentError("DOCX file appears to be empty.")
    return text


def _parse_txt(file_bytes: bytes) -> str:
    try:
        text = file_bytes.decode("utf-8", errors="strict")
    except UnicodeDecodeError as e:
        raise UnparseableDocumentError(f"Could not decode text file: {e}")

    if not text.strip():
        raise UnparseableDocumentError("Text file appears to be empty.")
    return text


# --- Format / parse-ability checklist (rule-based, Architecture §2.4 / §3.4) ---

def check_format_risks(filename: str, file_bytes: bytes) -> dict:
    """
    Lightweight, rule-based checklist — NOT a simulation of any specific
    vendor's ATS (those are proprietary). Flags known parsing risk factors.
    Returns {parse_risk_flags: [...], parse_ability_score: float}
    """
    flags = []
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""

    if ext == "pdf":
        try:
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                for page in pdf.pages:
                    if page.images and not (page.extract_text() or "").strip():
                        flags.append(
                            "Page appears to be an image with no text layer — "
                            "automated systems may not be able to read it."
                        )
                    if page.extract_tables():
                        flags.append(
                            "Document contains tables — some automated parsers "
                            "struggle with tabular layouts."
                        )
        except Exception:
            flags.append("Could not fully analyze PDF structure for formatting risks.")

    # Score: start at 1.0, deduct per distinct flag type, floor at 0.4
    score = max(0.4, 1.0 - 0.15 * len(set(flags)))

    return {"parse_risk_flags": list(set(flags)), "parse_ability_score": round(score, 2)}
