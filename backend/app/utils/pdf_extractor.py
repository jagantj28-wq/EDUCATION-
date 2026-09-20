import os
from pypdf import PdfReader
import logging

logger = logging.getLogger(__name__)


def extract_text_from_file(file_path: str) -> str:
    """
    Extracts text from PDF or TXT files.
    """
    if not os.path.exists(file_path):
        return ""

    ext = os.path.splitext(file_path)[1].lower()

    if ext == ".txt":
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()
        except Exception as e:
            logger.error(f"Error reading txt file {file_path}: {e}")
            return ""

    if ext == ".pdf":
        try:
            reader = PdfReader(file_path)
            extracted_pages = []
            for i, page in enumerate(reader.pages):
                text = page.extract_text()
                if text:
                    extracted_pages.append(text.strip())
            return "\n\n".join(extracted_pages)
        except Exception as e:
            logger.error(f"Error extracting PDF text from {file_path}: {e}")
            return ""

    return ""
