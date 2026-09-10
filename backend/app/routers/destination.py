from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.schemas.destination import DestinationCreate, DestinationResponse, DestinationListResponse, DestinationUpdate
from sqlalchemy.orm import Session
from app.core.database import get_db

from app.services.destination_service import create_destination, get_destinations, get_destination, update_destinaiton, delete_destination

router = APIRouter(prefix="/destinations", tags=["Destinations"])

@router.post("/", response_model=DestinationResponse, status_code=status.HTTP_201_CREATED)
def create(destination_data: DestinationCreate, db: Session = Depends(get_db)):
    try:
        return create_destination(db, destination_data)
    except ValueError as e:
        raise HTTPException(
            status_code=409,
            detail=str(e)
        )

@router.get("/", response_model=DestinationListResponse)
def get_all(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    destinations, total = get_destinations(db, page, limit)

    return {
        "items" : [
            DestinationResponse.model_validate(destination)
            for destination in destinations
        ],
        "page": page,
        "limit": limit,
        "total": total
    }

@router.get("/{destination_id}", response_model=DestinationResponse)
def get_one(destination_id: int, db: Session = Depends(get_db)):
    destination = get_destination(db, destination_id)

    if destination is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Destination not found",
        )

    return destination

@router.put("/{destination_id}", response_model=DestinationResponse)
def update(destination_id: int, destination_data: DestinationUpdate, db: Session = Depends(get_db)):
    destination = get_destination(db, destination_id)

    if destination is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Destination not found",
        )

    return update_destinaiton(db, destination, destination_data)

@router.delete("/{destination_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete(destination_id: int, db: Session = Depends(get_db)):
    destination = get_destination(db, destination_id)

    if destination is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Destination not found"
        )
    
    delete_destination(db, destination)
