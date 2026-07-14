import cloudinary
import cloudinary.uploader
import cloudinary.api
from app.config import get_settings


def configure_cloudinary():
    """Configura Cloudinary desde las variables de entorno."""
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
    if not configure_cloudinary():
        return None

    # Determinar formato por extensión
    ext = filename.split(".")[-1].lower() if "." in filename else "jpg"

    try:
        result = cloudinary.uploader.upload(
            file_bytes,
            public_id=f"user_{user_id}",
            overwrite=True,
            folder="turnogo/avatars",
            format=ext,
            transformation=[
                {"width": 400, "height": 400, "crop": "fill", "gravity": "face"}
            ],
        )
        return result.get("secure_url")
    except Exception as e:
        print(f"[Cloudinary] Error subiendo avatar: {e}")
        return None


def delete_avatar(public_id: str) -> bool:
    """Elimina un avatar de Cloudinary."""
    try:
        cloudinary.uploader.destroy(public_id)
        return True
    except Exception as e:
        print(f"[Cloudinary] Error eliminando avatar: {e}")
        return False
