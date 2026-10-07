from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.destination import Destination
from app.schemas.recommendation import RecommendationRequest
from app.services.destination_service import build_destination_response

WEIGHTS = {
    "interest": 0.35,
    "budget": 0.30,
    "duration": 0.20,
    "season": 0.15
}

def calculate_interest_score(user_interest_ids: list[int], destination_interest_ids: list[int]) -> float:
    user_interests = set(user_interest_ids)
    destination_interests = set(destination_interest_ids)

    # intersection - the interests that both contain
    matching_interests = user_interests & destination_interests

    return len(matching_interests) / len(user_interests)

def calculate_budget_score(user_budget: float, destination_cost: float) -> float:
    if destination_cost <= user_budget:
        return 1.0

    score = 1 - (
        (destination_cost - user_budget) / user_budget
    )

    return max(0.0, float(score))

def calculate_duration_score(user_days:int, min_days: int, max_days: int) -> float:
    if min_days <= user_days <= max_days:
        return 1.0

    if user_days < min_days:
        return user_days / min_days
    
    return max_days / user_days

def calculate_season_score(user_month: int, destination_months: list[int]) -> float:
    distances = [
        min(
            abs(user_month - month),
            12 - abs(user_month - month)
        )
        for month in destination_months 
    ]

    nearest_distance = min(distances)

    return 1 - (nearest_distance / 6)

def calculate_final_score(interest_score: float | None = None, budget_score: float | None = None, duration_score: float | None = None, season_score: float | None = None) -> float:
    scores = {
        "interest": interest_score,
        "budget": budget_score,
        "duration": duration_score,
        "season": season_score
    }

    active_scores = {
        name: score
        for name, score in scores.items()
        if score is not None
    }

    if not active_scores:
        raise ValueError("At least one recommendation criterion  is required")

    total_weights = sum(
        WEIGHTS[name]
        for name in active_scores
    )

    weighted_scores = sum(
        active_scores[name] * WEIGHTS[name]
        for name in active_scores
    )

    return weighted_scores / total_weights

def recommend_destination(db: Session, preferences: RecommendationRequest) -> list[dict]:
    destinations = db.scalars(
        select(Destination)
    ).all()

    recommendations = []

    for destination in destinations:
        destination_data = build_destination_response(db, destination)

        scores = {}
        reasons = {}

        if preferences.interest_ids:
            scores["interest"] = calculate_interest_score(
                preferences.interest_ids,
                destination_data["interest_ids"]
            )

            user_interests = set(preferences.interest_ids)
            destination_interests = set(
                destination_data["interest_ids"]
            )

            matched_interests = (
                user_interests & destination_interests
            )

            reasons["interests"] = {
                "matched": len(matched_interests),
                "requested": len(user_interests)
            }

        if preferences.budget is not None:
            scores["budget"] = calculate_budget_score(
                float(preferences.budget),
                float(destination.estimated_cost)
            )

            reasons["budget"] = {
                "user_budget": float(preferences.budget),
                "destination_cost": float(destination.estimated_cost),
                "within_budget": (
                    destination.estimated_cost <= preferences.budget
                )
            }

        if preferences.duration_days is not None:
            scores["duration"] = calculate_duration_score(
                preferences.duration_days,
                destination.recommended_min_days,
                destination.recommended_max_days
            )

            reasons["duration"] = {
                "user_days": preferences.duration_days,
                "min_days": destination.recommended_min_days,
                "max_days": destination.recommended_max_days,
                "within_range": (
                    destination.recommended_min_days <= preferences.duration_days <= destination.recommended_max_days
                )
            }

        if preferences.month is not None:
            scores["season"] = calculate_season_score(
                preferences.month,
                destination_data["months"]
            )

            distances = [
                min(
                    abs(preferences.month - month),
                    12 - abs(preferences.month - month)
                )
                for month in destination_data["months"]
            ]

            nearest_distance = min(distances)

            reasons["season"] = {
                "user_month": preferences.month,
                "recommended": preferences.month in destination_data["months"],
                "nearest_distance": nearest_distance
            }

        final_score = calculate_final_score(
            interest_score=scores.get("interest"),
            budget_score=scores.get("budget"),
            duration_score=scores.get("duration"),
            season_score=scores.get("season")
        )

        recommendations.append({
            "destination": destination_data,
            "score": final_score,
            "reasons": reasons,
            "_scores": scores
        })

    active_criteria = [
        name
        for name in ["interest", "budget", "duration", "season"]
        if name in recommendations[0]["_scores"]
    ] if recommendations else []

    recommendations.sort(
        key=lambda item: (
            -item["score"],
            *[
                -item["_scores"][criterion]
                for criterion in active_criteria
            ],
            item["destination"]["id"],
        )
    )

    for recommendation in recommendations:
        recommendation.pop("_scores")

    return recommendations