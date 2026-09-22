from datetime import date

from pydantic import BaseModel, ConfigDict
from app.schemas.destination import DestinationResponse

class TripCreate(BaseModel):
    name: str
    start_date: date
    end_date: date
    user_id: int

class TripResponse(BaseModel):
    id: int
    name: str
    start_date: date
    end_date: date
    user_id: int
    destinations: list[DestinationResponse] = []

    model_config = ConfigDict(from_attributes=True)