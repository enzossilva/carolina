"""Resize only oversized photos for the web. Originals are copied to images/_originals."""

from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
IMAGES = ROOT / "images"
ORIGINALS = IMAGES / "_originals"
MAX_SIDE = 2800
QUALITY = 90
SKIP_NAMES = {"whatsapp.png", "instagram.png", "gmail.png"}
EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def should_process(path: Path) -> bool:
    if path.suffix.lower() not in EXTENSIONS:
        return False
    if path.name.lower() in SKIP_NAMES:
        return False
    if "_originals" in path.parts:
        return False
    return True


def backup(path: Path) -> Path:
    dest = ORIGINALS / path.relative_to(IMAGES)
    dest.parent.mkdir(parents=True, exist_ok=True)
    if not dest.exists():
        dest.write_bytes(path.read_bytes())
    return dest


def resize(im: Image.Image) -> Image.Image:
    w, h = im.size
    longest = max(w, h)
    if longest <= MAX_SIDE:
        return im
    scale = MAX_SIDE / longest
    size = (round(w * scale), round(h * scale))
    return im.resize(size, Image.Resampling.LANCZOS)


def main() -> None:
    processed = 0
    saved = 0

    for path in sorted(IMAGES.rglob("*")):
        if not path.is_file() or not should_process(path):
            continue

        with Image.open(path) as im:
            if max(im.size) <= MAX_SIDE:
                continue
            before = path.stat().st_size
            icc = im.info.get("icc_profile")
            rgb = im.convert("RGB") if im.mode != "RGB" else im
            out = resize(rgb)
            backup(path)
            save_kwargs = {
                "quality": QUALITY,
                "optimize": True,
                "progressive": True,
            }
            if icc:
                save_kwargs["icc_profile"] = icc
            out.save(path, "JPEG", **save_kwargs)

        after = path.stat().st_size
        processed += 1
        saved += before - after
        print(f"{path.relative_to(IMAGES)}  {before/1e6:.2f}MB -> {after/1e6:.2f}MB")

    print(f"processed={processed}  saved_mb={saved/1e6:.1f}")


if __name__ == "__main__":
    main()
