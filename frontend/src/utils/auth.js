export function saveAuthToken(token) {
    if (token) {
        localStorage.setItem('authToken', token);
        console.log(localStorage.getItem('authToken'));
    }
}

export function getAuthToken() {
    return localStorage.getItem('authToken');
}

export function removeAuthToken() {
    localStorage.removeItem('authToken');
}
