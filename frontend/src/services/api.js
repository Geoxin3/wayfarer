export const BASE_URL = "http://localhost:8000";

export async function apiRequest(endpoint, options = {}) {
    const headers = {
        ...options.headers,
    };

    // browser set the multipart boundary for file uploads
    if (!(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    return response;
}
