import { apiRequest } from "./api";

export async function getRecommendations(preferences) {
    return apiRequest("/recommendations/", {
        method: "POST",
        body: JSON.stringify(preferences),
    });
}