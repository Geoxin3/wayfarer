from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.recommendation import RecommendationRequest, RecommendationResponse
from app.services.recommendation_service import recommend_destination

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])

@router.post("/", response_model=RecommendationResponse)
def recommend(preferences: RecommendationRequest, db: Session = Depends(get_db)):
    recommendations = recommend_destination(
        db,
        preferences
    )

    return {
        "recommendations": recommendations
    }