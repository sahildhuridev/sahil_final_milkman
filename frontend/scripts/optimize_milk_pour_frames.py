from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "raw-assets" / "milk-pour-frames"
OUTPUT_DIR = ROOT / "public" / "milk-pour-frames-webp"
MAX_WIDTH = 800
QUALITY = 45


def resize_image(image: Image.Image) -> Image.Image:
    if image.width <= MAX_WIDTH:
        return image

    ratio = MAX_WIDTH / image.width
    next_height = int(image.height * ratio)
    return image.resize((MAX_WIDTH, next_height), Image.Resampling.LANCZOS)


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    source_files = sorted(SOURCE_DIR.glob("frame_*.png"))

    if not source_files:
        raise SystemExit(f"No PNG frames found in {SOURCE_DIR}")

    for source_path in source_files:
        target_path = OUTPUT_DIR / f"{source_path.stem}.webp"
        with Image.open(source_path) as source_image:
            image = resize_image(source_image.convert("RGB"))
            image.save(
                target_path,
                format="WEBP",
                quality=QUALITY,
                method=6,
                optimize=True,
            )

    total_size_mb = sum(path.stat().st_size for path in OUTPUT_DIR.glob("*.webp")) / (1024 * 1024)
    print(f"Generated {len(source_files)} WebP frames in {OUTPUT_DIR}")
    print(f"Total output size: {total_size_mb:.2f} MB")


if __name__ == "__main__":
    main()
