import { apiRequest } from "./api";

export async function getDestinations(page = 1, limit = 10) {
    return apiRequest(`/destinations?page=${page}&limit=${limit}`);
}

export async function getDestination(id) {
    return apiRequest(`/destinations/${id}`);
}

export async function createDestination(destinationData) {
    return apiRequest("/destinations/", {
        method: "POST",
        body: JSON.stringify(destinationData),
    });
}

export async function updateDestination(id, destinationData) {
    return apiRequest(`/destinations/${id}`, {
        method: "PUT",
        body: JSON.stringify(destinationData),
    });
}

export async function deleteDestination(id) {
    return apiRequest(`/destinations/${id}`, {
        method: "DELETE",
    });
}