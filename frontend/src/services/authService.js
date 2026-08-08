import { apiRequest } from "./api";

// register user
export async function registerUser(userData) {
    return apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify(userData),
    });
}

// login user
export async function loginUser(userData) {
    return apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify(userData),
    })
}