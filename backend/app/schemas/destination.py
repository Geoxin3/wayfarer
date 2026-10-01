from pydantic import BaseModel, ConfigDict
from decimal import Decimal

class DestinationCreate(BaseModel):
    name: str
    description: str
    location: str
    category: str
    estimated_cost: Decimal
    recommended_min_days: int
    recommended_max_days: int
    best_time_to_visit: str

    months: list[int]
    interest_ids: list[int]

class DestinationUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    location: str | None = None
    category: str | None = None
    estimated_cost: Decimal | None = None
    recommended_min_days: int | None = None
    recommended_max_days: int | None = None
    best_time_to_visit: str | None = None

    months: list[int] | None = None
    interest_ids: list[int] | None = None

class DestinationResponse(BaseModel):
    id: int
    name: str
    description: str
    location: str
    category: str
    estimated_cost: Decimal
    recommended_min_days: int
    recommended_max_days: int
    best_time_to_visit: str

    months: list[int]
    interest_ids: list[int]

    model_config = ConfigDict(from_attributes=True)

class DestinationListResponse(BaseModel):
    items: list[DestinationResponse]
    page: int
    limit: int
    total: int