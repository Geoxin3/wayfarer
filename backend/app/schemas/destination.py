from pydantic import BaseModel, ConfigDict
from decimal import Decimal

class DestinationCreate(BaseModel):
    name: str
    description: str
    location: str
    category: str
    estimated_cost: Decimal
    best_time_to_visit: str

class DestinationUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    location: str | None = None
    category: str | None = None
    estimated_cost: Decimal | None = None
    best_time_to_visit: str | None = None

class DestinationResponse(BaseModel):
    id: int
    name: str
    description: str
    location: str
    category: str
    estimated_cost: Decimal
    best_time_to_visit: str

    model_config = ConfigDict(from_attributes=True)

class DestinationListResponse(BaseModel):
    items: list[DestinationResponse]
    page: int
    limit: int
    total: int