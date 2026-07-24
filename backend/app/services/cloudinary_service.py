"""
Cloudinary avatar service — single source of truth for all image operations.

Handles: validation (Pillow), upload, upload from URL (KYC), delete.
All Cloudinary configuration goes through this module only.
"""

import logging
from io import BytesIO

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)

# ─── Constants ───────────────────────────────────────────────────────────────

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
MAX_DIMENSIONS = (4000, 4000)  # max width, max height
AVATAR_SIZE = (400, 400)  # output crop
ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}
FOLDER_MANUAL = "turnogo/avatars/manual"
FOLDER_VERIFIED = "turnogo/avatars/verified"


# ─── Internal ────────────────────────────────────────────────────────────────

_cloudinary_configured = False


def _configure():
    """Lazy-configure Cloudinary once. Returns True if ready."""
    global _cloudinary_configured
    if _cloudinary_configured:
        return True
    try:
        import cloudinary
    except ImportError:
        logger.warning("cloudinary not installed")
        return False
    settings = get_settings()
    if not all(
        [
            settings.CLOUDINARY_CLOUD_NAME,
            settings.CLOUDINARY_API_KEY,
            settings.CLOUDINARY_API_SECRET,
        ]
    ):
        logger.warning("Cloudinary credentials not configured")
        return False
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )
    _cloudinary_configured = True
    return True


# ─── Validation ──────────────────────────────────────────────────────────────


class ImageValidationError(ValueError):
    """Raised when an image fails validation."""


def validate_image(file_bytes: bytes, max_size: int = MAX_FILE_SIZE) -> BytesIO:
    """
    Validate image with Pillow — real format, dimensions, size.
    Returns a BytesIO ready for upload (re-encoded as JPEG for consistency).

    Raises ImageValidationError on failure.
    """
    from PIL import Image, UnidentifiedImageError

    if len(file_bytes) > max_size:
        raise ImageValidationError(
            f"La imagen es muy grande. Maximo {max_size // (1024 * 1024)}MB."
        )

    try:
        img = Image.open(BytesIO(file_bytes))
        img.verify()  # Check file integrity without fully decoding
    except (UnidentifiedImageError, Exception):
        raise ImageValidationError(
            "El archivo no es una imagen valida. Usa JPG, PNG o WEBP."
        )

    # Re-open after verify() (verify closes the file handle)
    img = Image.open(BytesIO(file_bytes))

    if img.format not in ALLOWED_FORMATS:
        raise ImageValidationError(
            f"Formato no permitido: {img.format}. Usa JPG, PNG o WEBP."
        )

    if img.width > MAX_DIMENSIONS[0] or img.height > MAX_DIMENSIONS[1]:
        raise ImageValidationError(
            f"La imagen es muy grande ({img.width}x{img.height}). "
            f"Maximo {MAX_DIMENSIONS[0]}x{MAX_DIMENSIONS[1]}px."
        )

    # Convert to RGB for JPEG output (handles PNG transparency, WebP, etc.)
    if img.mode in ("RGBA", "P", "LA"):
        background = Image.new("RGB", img.size, (255, 255, 255))
        if img.mode == "P":
            img = img.convert("RGBA")
        background.paste(img, mask=img.split()[-1] if img.mode == "RGBA" else None)
        img = background
    elif img.mode != "RGB":
        img = img.convert("RGB")

    output = BytesIO()
    img.save(output, format="JPEG", quality=85, optimize=True)
    output.seek(0)
    return output


# ─── Public API ──────────────────────────────────────────────────────────────


def upload_avatar(file_bytes: bytes, user_id: int) -> str | None:
    """
    Validate and upload a user avatar to Cloudinary.
    Stores at: turnogo/avatars/manual/user_{id}
    Returns secure_url or None on failure.
    """
    if not _configure():
        return None

    import cloudinary.uploader

    try:
        validated = validate_image(file_bytes)
    except ImageValidationError as e:
        logger.warning(f"Avatar validation failed for user {user_id}: {e}")
        raise

    try:
        result = cloudinary.uploader.upload(
            validated.getvalue(),
            public_id=f"user_{user_id}",
            folder=FOLDER_MANUAL,
            overwrite=True,
            resource_type="image",
            transformation=[
                {"width": AVATAR_SIZE[0], "height": AVATAR_SIZE[1], "crop": "fill", "gravity": "face"}
            ],
        )
        return result.get("secure_url")
    except Exception as e:
        logger.error(f"Cloudinary upload failed for user {user_id}: {e}")
        return None


def upload_avatar_from_url(image_url: str, user_id: int) -> str | None:
    """
    Download a portrait from Didit and upload to Cloudinary (KYC verified).
    Stores at: turnogo/avatars/verified/user_{id}
    Returns secure_url or None on failure.
    """
    if not _configure():
        return None

    import cloudinary.uploader

    try:
        with httpx.Client(timeout=30) as client:
            resp = client.get(image_url)
            resp.raise_for_status()

        validated = validate_image(resp.content)
    except (ImageValidationError, Exception) as e:
        logger.error(f"KYC avatar download/validation failed for user {user_id}: {e}")
        return None

    try:
        result = cloudinary.uploader.upload(
            validated.getvalue(),
            public_id=f"user_{user_id}",
            folder=FOLDER_VERIFIED,
            overwrite=True,
            resource_type="image",
            transformation=[
                {"width": AVATAR_SIZE[0], "height": AVATAR_SIZE[1], "crop": "fill", "gravity": "face"}
            ],
        )
        return result.get("secure_url")
    except Exception as e:
        logger.error(f"Cloudinary KYC upload failed for user {user_id}: {e}")
        return None


def delete_avatar(public_id: str, folder: str = FOLDER_MANUAL) -> bool:
    """Delete an avatar from Cloudinary by public_id."""
    if not _configure():
        return False
    import cloudinary.uploader

    full_id = f"{folder}/{public_id}"
    try:
        cloudinary.uploader.destroy(full_id)
        return True
    except Exception as e:
        logger.error(f"Cloudinary delete failed for {full_id}: {e}")
        return False


def get_public_id(user_id: int, verified: bool = False) -> str:
    """Return the public_id for a user's avatar."""
    return f"user_{user_id}"
