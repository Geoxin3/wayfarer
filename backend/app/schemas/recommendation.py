from decimal import Decimal

from pydantic import BaseModel, Field

from app.schemas.destination import DestinationResponse

class InterestReason(BaseModel):
    matched: int
    requested: int

class BudgetReason(BaseModel):
    user_budget: float
    destination_cost: float
    within_budget: bool

class DurationReason(BaseModel):
    user_days: int
    min_days: int
    max_days: int
    within_range: bool

class SeasonReason(BaseModel):
    user_month: int
    recommended: bool
    nearest_distance: int

class RecommendationReasons(BaseModel):
    interests: InterestReason | None = None
    budget: BudgetReason | None = None
    duration: DurationReason | None = None
    season: SeasonReason | None = None

class RecommendationRequest(BaseModel):
    budget: Decimal | None = Field(default=None, gt=0)
    duration_days: int | None = Field(default=None, gt=0)
    interest_ids: list[int] | None = None
    month: int | None = Field(default=None, ge=1, le=12)

class RecommendationItem(BaseModel):
    destination: DestinationResponse
    score: float = Field(ge=0.0, le=1.0)
    reasons: RecommendationReasons

class RecommendationResponse(BaseModel):
    recommendations: list[RecommendationItem]
