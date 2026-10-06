from sqlalchemy.orm import Session
from sqlalchemy import func, select
from app.models.destination import Destination
from app.models.destination_month import DestinationMonth
from app.models.destination_interest import DestinationInterest
from app.models.interest import Interest
from app.schemas.destination import DestinationCreate, DestinationUpdate

# helper destination response
def build_destination_response(db: Session, destination: Destination) -> dict:
    months = db.scalars(select(DestinationMonth.month)
        .where(DestinationMonth.destination_id == destination.id)
    ).all()

    interest_ids = db.scalars(select(DestinationInterest.interest_id)
        .where(DestinationInterest.destination_id == destination.id)
    ).all()

    return {
        "id": destination.id,
        "name": destination.name,
        "description": destination.description,
        "location": destination.location,
        "category": destination.category,
        "estimated_cost": destination.estimated_cost,
        "recommended_min_days": destination.recommended_min_days,
        "recommended_max_days": destination.recommended_max_days,
        "best_time_to_visit": destination.best_time_to_visit,
        "months": list(months),
        "interest_ids": list(interest_ids),
    }

def get_destination_model(db: Session, destination_id: int):
    return db.scalar(
        select(Destination).where(Destination.id == destination_id)
    )

# create a new destination
def create_destination(db: Session, destination_data: DestinationCreate) -> Destination:
    existing_destination = db.scalar(
        select(Destination).where(
            Destination.name == destination_data.name,
            Destination.location == destination_data.location
        )
    )

    if existing_destination:
        raise ValueError("Destination already exists")

    destination = Destination(
        name=destination_data.name,
        description=destination_data.description,
        location=destination_data.location,
        category=destination_data.category,
        estimated_cost=destination_data.estimated_cost,
        recommended_min_days=destination_data.recommended_min_days,
        recommended_max_days=destination_data.recommended_max_days,
        best_time_to_visit=destination_data.best_time_to_visit
    )

    db.add(destination)
    db.flush()
    for month in destination_data.months:
        db.add(
            DestinationMonth(
                destination_id=destination.id,
                month=month
            )
        )

    for interest_id in destination_data.interest_ids:
        db.add(
            DestinationInterest(
                destination_id=destination.id,
                interest_id=interest_id
            )
        )

    db.commit()
    db.refresh(destination)

    return build_destination_response(db, destination)

# get destination / pagination implemented
def get_destinations(db: Session, page: int, limit: int) -> tuple[list[Destination], int]:
    offset = (page - 1) * limit

    destinations = db.scalars(
        select(Destination).offset(offset).limit(limit)
    ).all()

    total = db.scalar(select(func.count()).select_from(Destination))

    items = [
        build_destination_response(db, destination)
        for destination in destinations
    ]

    return items, total

# get destinaiton by id
def get_destination(db: Session, destination_id: int) -> Destination:
    destination = db.scalar(
        select(Destination).where(Destination.id == destination_id)
    )

    if destination is None:
        return None

    return build_destination_response(db, destination)

# update destination
def update_destinaiton(db: Session, destinaiton: Destination, destinaiton_data: DestinationUpdate) -> Destination:
    update_data = destinaiton_data.model_dump(exclude_unset=True)

    months = update_data.pop("months", None)
    interest_ids = update_data.pop("interest_ids", None)

    for field, value in update_data.items():
        setattr(destinaiton, field, value)

    if months is not None:
        db.query(DestinationMonth).filter(
            DestinationMonth.destination_id == destinaiton.id
        ).delete()

        for month in months:
            db.add(
                DestinationMonth(
                    destination_id=destinaiton.id,
                    month=month
                )
            )

    if interest_ids is not None:
        db.query(DestinationInterest).filter(
            DestinationInterest.destination_id == destinaiton.id
        ).delete()

        for interest_id in interest_ids:
            db.add(
                DestinationInterest(
                    destination_id=destinaiton.id,
                    interest_id=interest_id
                )
            )

    db.commit()

    return build_destination_response(db, destinaiton)

# delete a destination
def delete_destination(db: Session, destinaiton: Destination) -> None:
    db.delete(destinaiton)

    db.commit()

def get_interests(db: Session):
    return db.scalars(
        select(Interest).order_by(Interest.name)
    ).all()