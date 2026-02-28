import os

from PIL import Image


def generate_thumbnail(source_path: str, thumb_path: str, size: tuple[int, int] = (300, 300)) -> str:
    os.makedirs(os.path.dirname(thumb_path), exist_ok=True)
    with Image.open(source_path) as img:
        img.thumbnail(size, Image.Resampling.LANCZOS)
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
        img.save(thumb_path, "JPEG", quality=85)
    return thumb_path
