import * as Y from 'yjs';
import * as L from 'leaflet';
import { WebrtcProvider } from 'y-webrtc';
import * as awarenessProtocol from 'y-protocols/awareness.js';

export function saveAuthToken(token) {
    if (token) {
        localStorage.setItem('authToken', token);
    }
}

export function getAuthToken() {
    return localStorage.getItem('authToken');
}

export function removeAuthToken() {
    localStorage.removeItem('authToken');
}

export function showLogin(loginContainer, appContainer, loginError, loginForm) {
    if (loginContainer && appContainer) {
        loginContainer.style.display = 'flex';
        appContainer.style.display = 'none';

        if (loginError) loginError.style.display = 'none';
        if (loginForm) loginForm.reset();
    }
}

export function showApp(loginContainer, appContainer) {
    if (loginContainer && appContainer) {
        loginContainer.style.display = 'none';
        appContainer.style.display = 'flex';
    }
}

export function showLoginError(message, loginError) {
    if (loginError) {
        loginError.textContent = message;
        loginError.style.display = 'block';
    }
}

export function showLoginLoading(isLoading, loginForm) {
    const loginButton = loginForm ? loginForm.querySelector('button') : null;
    if (loginButton) {
        loginButton.disabled = isLoading;
        loginButton.innerHTML = isLoading
            ? '<i class="fas fa-spinner fa-spin"></i> Logging in...'
            : 'Login';
    }
}

export function updateUserWelcome(currentUsername, header) {
    if (!header) return;
    const oldWelcome = header.querySelector('.welcome-text');
    if (oldWelcome) oldWelcome.remove();

    const welcomeText = document.createElement('div');
    welcomeText.className = 'welcome-text';
    welcomeText.innerHTML = `Welcome, <strong>${currentUsername}</strong>`;
    header.prepend(welcomeText);
}

// --- Marker helpers ---
export function updateUserMarker(userData, map, userMarkers, currentUserId) {
    const { userId, lat, lng, accuracy, username, visible } = userData;
    if (!userId || lat === undefined || lng === undefined) return;

    if (!visible && userId !== currentUserId) {
        removeUserMarker(userId, map, userMarkers);
        return;
    }

    const position = [lat, lng];
    const isCurrentUser = userId === currentUserId;

    if (userMarkers.has(userId)) {
        const markerData = userMarkers.get(userId);
        markerData.marker.setLatLng(position);
        markerData.accuracyCircle.setLatLng(position).setRadius(accuracy || 50);
    } else {
        const markerColor = isCurrentUser ? '#3498db' : '#e74c3c';
        const marker = L.marker(position, {
            icon: L.divIcon({
                className: 'user-location-marker',
                iconSize: [24, 24],
                iconAnchor: [12, 12],
                html: `<div style="background-color: ${markerColor}; width: 100%; height: 100%; border-radius: 50%; border: 3px solid white;"></div>`,
            }),
        }).addTo(map);

        marker.bindPopup(`<strong>${username || userId}</strong>`);

        const accuracyCircle = L.circle(position, {
            radius: accuracy || 50,
            color: markerColor,
            fillOpacity: 0.15,
        }).addTo(map);

        userMarkers.set(userId, { marker, accuracyCircle });

        if (isCurrentUser) {
            map.setView(position, 15);
        }
    }
}

export function removeUserMarker(userId, map, userMarkers) {
    if (userMarkers.has(userId)) {
        const { marker, accuracyCircle } = userMarkers.get(userId);
        map.removeLayer(marker);
        map.removeLayer(accuracyCircle);
        userMarkers.delete(userId);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = '/api';
    const map = L.map('map', { attributionControl: false, zoomControl: true }).setView(
        [35.7219, 51.3347],
        13
    );

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

    const userMarkers = new Map();
    let currentUserId = null;
    let currentUsername = null;
    let authToken = null;
    let watchId = null;
    let provider = null;

    const loginContainer = document.getElementById('login-container');
    const appContainer = document.getElementById('app-container');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const logoutButton = document.getElementById('logout-button');
    const locationToggleBtn = document.getElementById('location-toggle');
    const coordsElement = document.getElementById('coordinates');
    const showLocationCheckbox = document.getElementById('show-location-checkbox');
    const recenterMapBtn = document.getElementById('recenter-map');
    const usersCountElement = document.getElementById('users-count');
    const usersListElement = document.getElementById('users-list');
    const header = document.querySelector('.header');

    // --- Yjs setup ---
    const doc = new Y.Doc();
    const yUsers = doc.getMap('users');

    function initializeProvider() {
        if (provider) {
            provider.destroy();
        }

        provider = new WebrtcProvider('map-room', doc, {
            signaling: ['wss://lib.itsario.ir/api/'],
            awareness: new awarenessProtocol.Awareness(doc),
        });

        provider.on('synced', () => {
            console.log('Provider synced');
        });

        provider.on('connection-error', (error) => {
            console.error('Connection error:', error);
        });
    }

    let isTracking = false;

    function updateLocationToggleButton() {
        if (!locationToggleBtn) return;

        if (isTracking) {
            locationToggleBtn.innerHTML = '<i class="fas fa-stop-circle"></i> Stop Sharing';
            locationToggleBtn.className = 'toggle-button stop-state';
        } else {
            locationToggleBtn.innerHTML = '<i class="fas fa-location-arrow"></i> Start Sharing';
            locationToggleBtn.className = 'toggle-button start-state';
        }
    }

    yUsers.observe((event) => {
        console.log('Users map changed:', event);
        event.keysChanged.forEach((userId) => {
            const userData = yUsers.get(userId);
            console.log(`User ${userId} data:`, userData);
            if (!userData) {
                removeUserMarker(userId, map, userMarkers);
            } else {
                updateUserMarker(userData, map, userMarkers, currentUserId);
            }
        });
        updateUsersList();
    });

    function sendLocation(lat, lng, accuracy) {
        if (!currentUserId) {
            console.log('No current user ID, cannot send location');
            return;
        }

        const visible = showLocationCheckbox ? showLocationCheckbox.checked : true;
        const userData = {
            userId: currentUserId,
            lat,
            lng,
            accuracy: accuracy || 50,
            username: currentUsername || currentUserId,
            visible: visible,
            timestamp: Date.now(),
        };

        console.log('Sending location:', userData);
        yUsers.set(currentUserId, userData);
    }

    function updateUsersList() {
        if (!usersCountElement || !usersListElement) return;

        const users = Array.from(yUsers.entries());
        usersCountElement.textContent = `${users.length} user${users.length !== 1 ? 's' : ''} online`;

        usersListElement.innerHTML = users
            .map(([userId, userData]) => {
                const isCurrentUser = userId === currentUserId;
                const lastSeen = userData.timestamp
                    ? new Date(userData.timestamp).toLocaleTimeString()
                    : 'Unknown';
                return `<div class="user-item ${isCurrentUser ? 'current-user' : ''}">
                <i class="fas fa-user"></i> ${userData.username || userId} 
                ${isCurrentUser ? '(You)' : ''} 
                <span class="last-seen">${lastSeen}</span>
            </div>`;
            })
            .join('');
    }

    // --- Geolocation ---
    function startWatchingPosition() {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by this browser.');
            return;
        }

        console.log('Starting position watch');
        isTracking = true;
        updateLocationToggleButton();

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000,
        };

        watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude, accuracy } = pos.coords;
                console.log('Position update:', { latitude, longitude, accuracy });

                if (coordsElement) {
                    coordsElement.innerHTML = `<i class="fas fa-crosshairs"></i> Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`;
                }

                sendLocation(latitude, longitude, accuracy);
            },
            (error) => {
                console.error('Geolocation error:', error);
                let errorMessage = 'Location error: ';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage += 'Location access denied by user.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage += 'Location information unavailable.';
                        break;
                    case error.TIMEOUT:
                        errorMessage += 'Location request timed out.';
                        break;
                    default:
                        errorMessage += 'Unknown error occurred.';
                        break;
                }

                if (coordsElement) {
                    coordsElement.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${errorMessage}`;
                }
            },
            options
        );
    }

    function stopWatchingPosition() {
        console.log('Stopping position watch');
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
            watchId = null;
        }

        isTracking = false;
        updateLocationToggleButton();

        if (coordsElement) {
            coordsElement.innerHTML = '<i class="fas fa-crosshairs"></i> Location sharing stopped';
        }

        // Remove current user's marker and data
        removeUserMarker(currentUserId);
        if (currentUserId) {
            yUsers.delete(currentUserId);
        }
    }

    function toggleLocationSharing() {
        if (isTracking) {
            stopWatchingPosition();
        } else {
            startWatchingPosition();
        }
    }

    // --- Event Listeners ---
    if (locationToggleBtn) {
        locationToggleBtn.addEventListener('click', toggleLocationSharing);
    }

    if (showLocationCheckbox) {
        showLocationCheckbox.addEventListener('change', () => {
            if (currentUserId && watchId !== null) {
                const currentData = yUsers.get(currentUserId);
                if (currentData) {
                    sendLocation(currentData.lat, currentData.lng, currentData.accuracy);
                }
            }
        });
    }

    if (recenterMapBtn) {
        recenterMapBtn.addEventListener('click', () => {
            if (currentUserId && userMarkers.has(currentUserId)) {
                const markerData = userMarkers.get(currentUserId);
                const position = markerData.marker.getLatLng();
                map.setView(position, 15);
            }
        });
    }

    async function attemptAutoLogin() {
        const token = getAuthToken();
        if (!token) {
            showLogin();
            return;
        }

        console.log('Attempting auto-login with stored token...');

        try {
            const res = await fetch(`${API_BASE_URL}/verify-token`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                throw new Error('Token validation failed');
            }

            const data = await res.json();

            saveAuthToken(token);
            currentUserId = data.user.id;
            currentUsername = data.user.username;

            console.log('Auto-login successful for:', currentUsername);

            initializeProvider();
            showApp(loginContainer, appContainer);
            updateLocationToggleButton();
            updateUserWelcome(currentUsername, header);
        } catch (err) {
            console.error('Auto-login failed:', err.message);
            removeAuthToken();
            showLogin(loginContainer, appContainer, loginError, loginForm);
        }
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username')?.value.trim();
            const password = document.getElementById('password')?.value.trim();

            if (!username || !password) {
                showLoginError('Please enter both username and password', loginError);
                return;
            }

            showLoginLoading(true, loginForm);

            try {
                const res = await fetch(`${API_BASE_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password }),
                });

                if (!res.ok) {
                    throw new Error('Invalid username or password');
                }

                const data = await res.json();

                if (data.token) {
                    saveAuthToken(data.token);
                }

                currentUserId = data.user.id;
                currentUsername = data.user.username || username;
                console.log('Logged in as:', currentUserId);

                initializeProvider();
                showApp(loginContainer, appContainer);
                updateLocationToggleButton();
                updateUserWelcome(currentUsername, header);
            } catch (err) {
                console.error('Login error:', err);
                showLoginError(err.message, loginError);
            } finally {
                showLoginLoading(false, loginForm);
            }
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            stopWatchingPosition();

            if (authToken) {
                try {
                    await fetch(`${API_BASE_URL}/logout`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${authToken}`,
                        },
                    });
                } catch (error) {
                    console.error('Logout API call failed:', error);
                }
            }

            if (provider) {
                provider.destroy();
                provider = null;
            }

            userMarkers.forEach((_, userId) => removeUserMarker(userId));
            userMarkers.clear();

            currentUserId = null;
            currentUsername = null;

            removeAuthToken();

            isTracking = false;
            updateLocationToggleButton();
            showLogin(loginContainer, appContainer, loginError, loginForm);
        });
    }
    attemptAutoLogin();
});
