from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.trip import Trip
from app.models.destination import Destination
from app.models.trip_destination import TripDestination
from app.schemas.trip import TripCreate

def create_trip(db: Session, trip_data: TripCreate):
    trip = Trip(
        name=trip_data.name,
        start_date=trip_data.start_date,
        end_date=trip_data.end_date,
        user_id=trip_data.user_id
    )

    db.add(trip)
    db.commit()
    db.refresh(trip)

    return trip

def get_user_trips(db: Session, user_id: int):
    result = db.execute(
        select(Trip)
        .where(Trip.user_id == user_id)
        .order_by(Trip.id.desc())
    )

    return result.scalars().all()

def get_trip(db: Session, trip_id: int, user_id: int):
    result = db.execute(
        select(Trip)
        .options(selectinload(Trip.destinations))
        .where(
            Trip.id == trip_id,
            Trip.user_id == user_id
        )
    )

    return result.scalar_one_or_none()

def add_destination_to_trip(db: Session, trip_id: int, destination_id: int):
    trip = db.get(Trip, trip_id)

    if trip is None:
        return None, "trip not found"

    destination = db.get(Destination, destination_id)

    if destination is None:
        return None, "destination not found"

    existing = db.execute(
        select(TripDestination)
        .where(
            TripDestination.trip_id == trip_id,
            TripDestination.destination_id == destination_id
        )
    ).scalar_one_or_none()

    if existing is not None:
        return None, "destination already added"

    trip_destination = TripDestination(
        trip_id=trip_id,
        destination_id=destination_id
    )

    db.add(trip_destination)
    db.commit()

    return trip_destination, None

def remove_destination_from_trip(db: Session, trip_id: int, destination_id: int):
    trip_destination = db.execute(
        select(TripDestination)
        .where(
            TripDestination.trip_id == trip_id,
            TripDestination.destination_id == destination_id
        )
    ).scalar_one_or_none()

    if trip_destination is None:
        return False

    db.delete(trip_destination)
    db.commit()

    return True