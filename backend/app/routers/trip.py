from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.trip import TripCreate, TripResponse
from app.services.trip_service import create_trip, get_trip, get_user_trips, add_destination_to_trip, remove_destination_from_trip

router = APIRouter(prefix="/trips", tags=["Trips"])

@router.post("/", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
def create_new_trip(trip_data: TripCreate, db: Session = Depends(get_db)):
    trip = create_trip(db, trip_data)

    return trip

@router.get("/", response_model=list[TripResponse])
def get_my_trips(user_id: int, db: Session = Depends(get_db)):
    return get_user_trips(db, user_id)

@router.get("/{trip_id}", response_model=TripResponse)
def get_my_trip(trip_id: int, user_id: int, db: Session = Depends(get_db)):
    trip = get_trip(db, trip_id, user_id)

    if trip is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found"
        )

    return trip

@router.post("/{trip_id}/destinations/{destination_id}")
def add_destination(trip_id: int, destination_id: int, db: Session = Depends(get_db)):
    result, error = add_destination_to_trip(db, trip_id, destination_id)

    if error == "trip not found":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trip not found"
        )
    
    if error == "destination not found":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Destination not found"
        )
    
    if error == "destination already added":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Destination alreddy added to trip"
        )
    
    return {
        "message": "Destination added to trip"
    }

@router.delete("/{trip_id}/destinations/{destination_id}")
def remove_destination(trip_id: int, destination_id: int, db: Session = Depends(get_db)):
    removed = remove_destination_from_trip(db, trip_id, destination_id)

    if not removed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Destination is not part of the trip"
        )
    
    return {
        "message": "Destination removed from trip"
    }