import re
from pathlib import Path
from uuid import uuid4

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.destination import Destination
from app.models.destination_image import DestinationImage


router = APIRouter(prefix="/destinations", tags=["Destination Images"])

BACKEND_DIR = Path(__file__).resolve().parents[2]

UPLOAD_DIR = BACKEND_DIR / "uploads" / "destinations"

ALLOWED_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}

#5 MB per image
MAX_FILE_SIZE = 5 * 1024 * 1024 


def create_destination_slug(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return slug or "destination"


async def save_image_file(file: UploadFile, destination_dir: Path) -> Path:
    extension = ALLOWED_TYPES.get(file.content_type)

    if extension is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported image type",
        )

    content = await file.read(MAX_FILE_SIZE + 1)

    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image file is empty",
        )

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail="Image exceeds 5 MB",
        )

    destination_dir.mkdir(parents=True, exist_ok=True)

    file_path = destination_dir / f"{uuid4().hex}{extension}"
    file_path.write_bytes(content)

    return file_path


#upload multiple images to a destination
@router.post("/{destination_id}/images", status_code=status.HTTP_201_CREATED)
async def upload_destination_images(
    destination_id: int,
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
):

    destination = db.get(Destination, destination_id)

    if destination is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Destination not found",
        )

    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one image is required",
        )

    destination_dir = (
        UPLOAD_DIR / create_destination_slug(destination.name)
    )

    saved_paths: list[Path] = []
    saved_relative_paths: list[str] = []

    try:
        for file in files:
            file_path = await save_image_file(file, destination_dir)
            saved_paths.append(file_path)

            relative_path = file_path.relative_to(UPLOAD_DIR.parent).as_posix()

            db.add(
                DestinationImage(
                    destination_id=destination.id,
                    image_path=relative_path,
                )
            )

            saved_relative_paths.append(relative_path)

        db.commit()

    except Exception:
        db.rollback()

        for file_path in saved_paths:
            file_path.unlink(missing_ok=True)

        raise

    finally:
        for file in files:
            await file.close()

    return {
        "message": "Images uploaded successfully",
        "images": saved_relative_paths,
    }


#list images belongs to one destination
@router.get("/{destination_id}/images")
def get_destination_images(destination_id: int, db: Session = Depends(get_db)):
    destination = db.get(Destination, destination_id)

    if destination is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Destination not found",
        )

    images = (
        db.query(DestinationImage)
        .filter(
            DestinationImage.destination_id == destination_id
        )
        .order_by(DestinationImage.id)
        .all()
    )

    return [
        {
            "id": image.id,
            "image_path": image.image_path,
        }
        for image in images
    ]


#update one existing image
@router.put("/{destination_id}/images/{image_id}")
async def update_destination_image(
    destination_id: int,
    image_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):

    image = db.get(DestinationImage, image_id)

    if image is None or image.destination_id != destination_id:
        await file.close()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found",
        )

    destination = db.get(Destination, destination_id)

    destination_dir = (
        UPLOAD_DIR / create_destination_slug(destination.name)
    )

    new_file_path = await save_image_file(file, destination_dir)
    relative_path = (
        new_file_path.relative_to(UPLOAD_DIR.parent).as_posix()
    )

    old_file_path = BACKEND_DIR / image.image_path

    try:
        image.image_path = relative_path
        db.commit()
        db.refresh(image)

    except Exception:
        db.rollback()
        new_file_path.unlink(missing_ok=True)
        raise

    finally:
        await file.close()

    if old_file_path != new_file_path:
        old_file_path.unlink(missing_ok=True)

    return {
        "message": "Image updated successfully",
        "id": image.id,
        "image_path": image.image_path,
    }


#delete one image from a destination
@router.delete("/{destination_id}/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_destination_image(
    destination_id: int,
    image_id: int,
    db: Session = Depends(get_db),
):

    image = db.get(DestinationImage, image_id)

    if image is None or image.destination_id != destination_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found",
        )

    file_path = BACKEND_DIR / image.image_path

    db.delete(image)
    db.commit()

    file_path.unlink(missing_ok=True)