export function saveAuthToken(token) {
    if (token) {
        sessionStorage.setItem('authToken', token);
    }
}

export function getAuthToken() {
    return sessionStorage.getItem('authToken');
}

export function removeAuthToken() {
    sessionStorage.removeItem('authToken');
}
