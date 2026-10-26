import { apiRequest } from "./api";

export async function getDestinations(page = 1, limit = 10) {
    return apiRequest(`/destinations?page=${page}&limit=${limit}`);
}

export async function getDestination(id) {
    return apiRequest(`/destinations/${id}`);
}

export async function getInterests() {
    return apiRequest("/destinations/interests");
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

// images api
export async function getDestinationImages(destinationId) {
    return apiRequest(`/destinations/${destinationId}/images`);
}

export async function uploadDestinationImages(destinationId, files) {
    const formData = new FormData();

    for (const file of files) {
        formData.append("files", file);
    }

    return apiRequest(`/destinations/${destinationId}/images`, {
        method: "POST",
        body: formData,
    });
}

export async function updateDestinationImage(
    destinationId,
    imageId,
    file
) {
    const formData = new FormData();
    formData.append("file", file);

    return apiRequest(
        `/destinations/${destinationId}/images/${imageId}`,
        {
            method: "PUT",
            body: formData,
        }
    );
}

export async function deleteDestinationImage(
    destinationId,
    imageId
) {
    return apiRequest(
        `/destinations/${destinationId}/images/${imageId}`,
        {
            method: "DELETE",
        }
    );
}