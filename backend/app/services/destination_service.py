from sqlalchemy.orm import Session
from sqlalchemy import func, select
from app.models.destination import Destination 
from app.schemas.destination import DestinationCreate, DestinationUpdate

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
        best_time_to_visit=destination_data.best_time_to_visit
    )

    db.add(destination)
    db.commit()
    db.refresh(destination)

    return destination

# get destination / pagination implemented
def get_destinations(db: Session, page: int, limit: int) -> tuple[list[Destination], int]:
    offset = (page - 1) * limit

    destinations = db.scalars(
        select(Destination).offset(offset).limit(limit)
    ).all()

    total = db.scalar(select(func.count()).select_from(Destination))
    return list(destinations), total

# get destinaiton by id
def get_destination(db: Session, destination_id: int) -> Destination:
    result = db.execute(select(Destination).where(Destination.id == destination_id))

    return result.scalar_one_or_none()

# update destination
def update_destinaiton(db: Session, destinaiton: Destination, destinaiton_data: DestinationUpdate) -> Destination:
    update_data = destinaiton_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(destinaiton, field, value)

    db.commit()
    db.refresh(destinaiton)

    return destinaiton

# delete a destination
def delete_destination(db: Session, destinaiton: Destination) -> None:
    db.delete(destinaiton)

    db.commit()