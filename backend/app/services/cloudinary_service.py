"""
Cloudinary avatar service — upload, delete profile images.

NOTE: cloudinary is an optional dependency. Import is lazy so tests
can run without it installed. Functions return None when cloudinary
is not available or not configured.
"""

import logging

from app.config import get_settings

logger = logging.getLogger(__name__)


def _ensure_cloudinary():
    """Lazy-import and configure cloudinary. Returns True if ready."""
    try:
        import cloudinary
    except ImportError:
        return False
    settings = get_settings()
    if not settings.CLOUDINARY_CLOUD_NAME:
        return False
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )
    return True


def upload_avatar(file_bytes: bytes, user_id: int, filename: str) -> str | None:
    """
    Sube un avatar a Cloudinary.
    Returns: URL segura de la imagen o None si falla.
    """
    if not _ensure_cloudinary():
        return None

    import cloudinary.uploader

    ext = filename.split(".")[-1].lower() if "." in filename else "jpg"

    try:
        result = cloudinary.uploader.upload(
            file_bytes,
            public_id=f"user_{user_id}",
            overwrite=True,
            folder="turnogo/avatars",
            format=ext,
            transformation=[{"width": 400, "height": 400, "crop": "fill", "gravity": "face"}],
        )
        return result.get("secure_url")
    except Exception as e:
        logger.error("Cloudinary avatar upload failed", extra={"error": str(e)})
        return None


def delete_avatar(public_id: str) -> bool:
    """Elimina un avatar de Cloudinary."""
    if not _ensure_cloudinary():
        return False
    import cloudinary.uploader

    try:
        cloudinary.uploader.destroy(public_id)
        return True
    except Exception as e:
        logger.error("Cloudinary avatar delete failed", extra={"error": str(e)})
        return False
