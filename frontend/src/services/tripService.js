import { apiRequest } from "./api";

export async function createTrip(tripData) {
  return apiRequest("/trips/", {
    method: "POST",
    body: JSON.stringify(tripData),
  });
}

export async function getTrips(userId) {
  return apiRequest(`/trips/?user_id=${userId}`);
}

export async function getTrip(tripId, userId) {
  return apiRequest(`/trips/${tripId}?user_id=${userId}`);
}

export async function updateTrip(tripId, userId, tripData) {
  return apiRequest(
    `/trips/${tripId}?user_id=${userId}`,
    {
      method: "PUT",
      body: JSON.stringify(tripData),
    }
  );
}

export async function deleteTrip(tripId, userId) {
  return apiRequest(
    `/trips/${tripId}?user_id=${userId}`,
    {
      method: "DELETE",
    }
  );
}

export async function addDestinationToTrip(
  tripId,
  destinationId
) {
  return apiRequest(
    `/trips/${tripId}/destinations/${destinationId}`,
    {
      method: "POST",
    }
  );
}

export async function removeDestinationFromTrip(
  tripId,
  destinationId
) {
  return apiRequest(
    `/trips/${tripId}/destinations/${destinationId}`,
    {
      method: "DELETE",
    }
  );
}