/* global L */

document.addEventListener('DOMContentLoaded', function () {
    const { protocol, host, pathname } = window.location;

    const basePath = pathname.replace(/\/$/, '');

    const API_BASE_URL = `/api`;

    const WS_PROTOCOL = protocol === 'https:' ? 'wss:' : 'ws:';
    const WS_BASE_URL = `${WS_PROTOCOL}//${host}${basePath}`;

    let map = L.map('map', {
        dragging: true,
        attributionControl: false,
        zoomControl: true,
    }).setView([35.7219, 51.3347], 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const userMarkers = new Map();
    let currentUserId = null;
    let watchId = null;
    let hasZoomedToLocation = false;
    let lastKnownPosition = null;
    let lastSentPosition = null;

    let updateInterval = null;
    const UPDATE_DELAY = 5000;
    let pendingLocationUpdate = false;
    let lastPositionData = null;

    let socket = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const reconnectDelay = 3000;
    let reconnectTimeout = null;

    const loginContainer = document.getElementById('login-container');
    const appContainer = document.getElementById('app-container');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const logoutButton = document.getElementById('logout-button');
    const startTrackingBtn = document.getElementById('start-tracking');
    const stopTrackingBtn = document.getElementById('stop-tracking');
    const connectionStatus = document.getElementById('connection-status');
    const coordsElement = document.getElementById('coordinates');
    const usersList = document.getElementById('users-list');
    const usersCount = document.getElementById('users-count');
    const recenterMapBtn = document.getElementById('recenter-map');
    const showLocationCheckbox = document.getElementById('show-location-checkbox');

    function checkAuth() {
        const token = localStorage.getItem('token');

        if (token) {
            fetch(API_BASE_URL + '/verify-token', {
                method: 'POST',
                headers: {
                    Authorization: 'Bearer ' + token,
                },
            })
                .then((response) => {
                    if (response.ok) {
                        return response.json();
                    } else {
                        throw new Error('Invalid token');
                    }
                })
                .then((data) => {
                    currentUserId = data.user.id;
                    showApp();
                    connectWebSocket(token);
                })
                .catch((error) => {
                    console.error('Authentication error:', error);
                    localStorage.removeItem('token');
                    showLogin();
                });
        } else {
            showLogin();
        }
    }

    function showLogin() {
        loginContainer.style.display = 'flex';
        appContainer.style.display = 'none';
    }

    function showApp() {
        loginContainer.style.display = 'none';
        appContainer.style.display = 'flex';
    }

    function updateConnectionStatus(message, connected = false) {
        connectionStatus.textContent = message;
        connectionStatus.className = connected ? 'status-connected' : 'status-disconnected';

        const iconClass = connected ? 'fa-check-circle' : 'fa-exclamation-triangle';
        connectionStatus.innerHTML = `<i class="fas ${iconClass}"></i> ${message}`;
    }

    function clearAllMarkers() {
        userMarkers.forEach((markerData) => {
            map.removeLayer(markerData.marker);
            map.removeLayer(markerData.accuracyCircle);
        });
        userMarkers.clear();
        updateUsersList();
    }

    function updateUserMarker(userData) {
        try {
            const userId = userData.userId;
            const username = userData.username || 'User';
            const lat = parseFloat(userData.lat);
            const lng = parseFloat(userData.lng);
            const accuracy = parseFloat(userData.accuracy) || 10;

            if (!userId || isNaN(lat) || isNaN(lng)) {
                console.error('Invalid marker data:', userData);
                return;
            }

            const position = [lat, lng];
            const isCurrentUser = userId === currentUserId;

            if (userMarkers.has(userId)) {
                const markerData = userMarkers.get(userId);

                markerData.marker.setLatLng(position);
                markerData.marker
                    .getPopup()
                    .setContent(createPopupContent(username, accuracy, isCurrentUser));

                markerData.accuracyCircle.setLatLng(position);
                markerData.accuracyCircle.setRadius(accuracy);
                markerData.lastUpdated = Date.now();
                markerData.username = username;

                if (isCurrentUser) {
                    lastKnownPosition = position;
                }
            } else {
                const markerColor = isCurrentUser ? '#3498db' : '#e74c3c';
                const fillColor = isCurrentUser ? '#3498db' : '#e74c3c';

                try {
                    const marker = L.marker(position, {
                        icon: L.divIcon({
                            className: 'user-location-marker',
                            html: `<div class="user-location-pulse" style="border-color:${markerColor}"></div>
                                    <div class="user-location-point" style="background-color:${markerColor}"></div>`,
                            iconSize: [24, 24],
                            iconAnchor: [12, 12],
                        }),
                    }).addTo(map);

                    marker.bindPopup(createPopupContent(username, accuracy, isCurrentUser));

                    const accuracyCircle = L.circle(position, {
                        radius: accuracy,
                        weight: 1,
                        color: markerColor,
                        fillColor: fillColor,
                        fillOpacity: 0.15,
                    }).addTo(map);

                    userMarkers.set(userId, {
                        marker: marker,
                        accuracyCircle: accuracyCircle,
                        lastUpdated: Date.now(),
                        isCurrentUser: isCurrentUser,
                        username: username,
                    });

                    if (isCurrentUser) {
                        lastKnownPosition = position;

                        if (!hasZoomedToLocation) {
                            map.setView(position, 15);
                            hasZoomedToLocation = true;
                        }
                    }
                } catch (error) {
                    console.error('Error creating marker:', error);
                }
            }

            updateUsersList();
        } catch (error) {
            console.error('Error in updateUserMarker:', error);
        }
    }

    function createPopupContent(username, accuracy, isCurrentUser) {
        return `
            <div class="user-popup">
                <h4>${isCurrentUser ? `You (${username})` : username}</h4>
                <p>Accuracy: ${accuracy.toFixed(2)}m</p>
                <p>Updated: ${formatTime(new Date())}</p>
            </div>
        `;
    }

    function formatTime(date) {
        return date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    }

    function removeUserMarker(userId) {
        if (userMarkers.has(userId)) {
            const markerData = userMarkers.get(userId);
            map.removeLayer(markerData.marker);
            map.removeLayer(markerData.accuracyCircle);
            userMarkers.delete(userId);
            updateUsersList();
        }
    }

    function updateUsersList() {
        usersList.innerHTML = '';
        usersCount.textContent = userMarkers.size + ' users online';

        userMarkers.forEach((markerData, userId) => {
            const userItem = document.createElement('div');
            userItem.className = 'user-item';

            if (userId === currentUserId) {
                userItem.className += ' current';
            }

            const timeAgo = Math.floor((Date.now() - markerData.lastUpdated) / 1000);
            const markerPos = markerData.marker.getLatLng();
            const isOnline = timeAgo < 60;

            const username = markerData.username || 'User';

            userItem.innerHTML = `
                <strong>${userId === currentUserId ? `You (${username})` : username}</strong>
                <div class="user-details">
                    <div><i class="fas fa-map-marker-alt"></i> Lat: ${markerPos.lat.toFixed(6)}, Lng: ${markerPos.lng.toFixed(6)}</div>
                    <div><i class="fas fa-clock"></i> Updated: ${formatTimeAgo(timeAgo)}</div>
                    <div class="user-status ${isOnline ? 'online' : 'offline'}">
                        <i class="fas fa-circle"></i> ${isOnline ? 'Online' : 'Inactive'}
                    </div>
                </div>
            `;

            userItem.addEventListener('click', () => {
                map.setView([markerPos.lat, markerPos.lng], 15);
                markerData.marker.openPopup();
            });

            usersList.appendChild(userItem);
        });
    }

    function formatTimeAgo(seconds) {
        if (seconds < 60) {
            return seconds + ' seconds ago';
        } else if (seconds < 3600) {
            return Math.floor(seconds / 60) + ' minutes ago';
        } else {
            return Math.floor(seconds / 3600) + ' hours ago';
        }
    }

    function startWatchingPosition() {
        if ('geolocation' in navigator) {
            startTrackingBtn.disabled = true;
            stopTrackingBtn.disabled = false;

            startLocationUpdateInterval();

            navigator.geolocation.getCurrentPosition(handlePosition, handlePositionError, {
                enableHighAccuracy: true,
                timeout: 10000,
            });

            watchId = navigator.geolocation.watchPosition(handlePosition, handlePositionError, {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 10000,
            });
        } else {
            showError('Geolocation is not supported by your browser.');
            startTrackingBtn.disabled = true;
            stopTrackingBtn.disabled = true;
        }
    }

    function startLocationUpdateInterval() {
        if (updateInterval) {
            clearInterval(updateInterval);
        }

        updateInterval = setInterval(() => {
            if (pendingLocationUpdate && lastPositionData) {
                sendLocationUpdate(lastPositionData);
                pendingLocationUpdate = false;
            }
        }, UPDATE_DELAY);
    }

    function stopLocationUpdateInterval() {
        if (updateInterval) {
            clearInterval(updateInterval);
            updateInterval = null;
        }
    }

    function handlePosition(position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        coordsElement.innerHTML = `
            <i class="fas fa-crosshairs"></i> Your location: 
            Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}
        `;

        const userData = {
            userId: currentUserId,
            lat: lat,
            lng: lng,
            accuracy: accuracy,
            timestamp: Date.now(),
            showLocationToEveryone: showLocationCheckbox ? showLocationCheckbox.checked : false,
        };

        updateUserMarker(userData);

        lastPositionData = userData;
        pendingLocationUpdate = true;

        if (!lastSentPosition || calculateDistance(lastSentPosition, [lat, lng]) > 10) {
            sendLocationUpdate(userData);
            pendingLocationUpdate = false;
            lastSentPosition = [lat, lng];
        }
    }

    function calculateDistance(pos1, pos2) {
        if (!pos1 || !pos2) return 10000;

        const latDiff = pos1[0] - pos2[0];
        const lngDiff = pos1[1] - pos2[1];
        return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111000;
    }

    function sendLocationUpdate(userData) {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(userData));
            lastSentPosition = [userData.lat, userData.lng];
        }
    }

    function handlePositionError(error) {
        console.error('Error tracking location:', error);

        let errorMessage = 'Location error: ';

        switch (error.code) {
            case error.PERMISSION_DENIED:
                errorMessage += 'Location permission denied. Please enable location services.';
                break;
            case error.POSITION_UNAVAILABLE:
                errorMessage += 'Location information is unavailable.';
                break;
            case error.TIMEOUT:
                errorMessage += 'Request to get location timed out.';
                break;
            default:
                errorMessage += 'An unknown error occurred.';
        }

        showError(errorMessage);
        stopWatchingPosition();
    }

    function stopWatchingPosition() {
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
            watchId = null;
        }

        stopLocationUpdateInterval();

        startTrackingBtn.disabled = false;
        stopTrackingBtn.disabled = true;

        if (socket && socket.readyState === WebSocket.OPEN && currentUserId) {
            socket.send(
                JSON.stringify({
                    userId: currentUserId,
                    type: 'disconnect',
                })
            );
        }

        if (userMarkers.has(currentUserId)) {
            removeUserMarker(currentUserId);
        }

        coordsElement.innerHTML = '<i class="fas fa-crosshairs"></i> Waiting for location...';
    }

    function connectWebSocket(token) {
        updateConnectionStatus('Connecting to server...');

        if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
        }

        if (socket) {
            socket.close();
        }

        try {
            const wsUrl = `${WS_BASE_URL}/?token=${encodeURIComponent(token)}`;
            socket = new WebSocket(wsUrl);

            socket.onopen = handleSocketOpen;
            socket.onclose = handleSocketClose;
            socket.onerror = handleSocketError;
            socket.onmessage = handleSocketMessage;
        } catch (error) {
            console.error('Error creating WebSocket:', error);
            handleSocketError(error);
        }
    }

    function handleSocketOpen() {
        console.log('Connected to WebSocket server');
        updateConnectionStatus('Connected to server', true);
        reconnectAttempts = 0;
        startTrackingBtn.disabled = false;
    }

    function handleSocketClose(event) {
        console.log('Disconnected from WebSocket server', event);
        updateConnectionStatus('Disconnected from server', false);

        stopWatchingPosition();
        startTrackingBtn.disabled = true;
        stopTrackingBtn.disabled = true;

        if (reconnectAttempts < maxReconnectAttempts) {
            updateConnectionStatus(
                `Reconnecting (${reconnectAttempts + 1}/${maxReconnectAttempts})...`,
                false
            );

            reconnectTimeout = setTimeout(() => {
                const token = localStorage.getItem('token');
                if (token) {
                    connectWebSocket(token);
                }
            }, reconnectDelay);

            reconnectAttempts++;
        } else {
            updateConnectionStatus('Failed to connect. Please refresh the page.', false);
            clearAllMarkers();
        }
    }

    function handleSocketError(error) {
        console.error('WebSocket Error:', error);
        updateConnectionStatus('Connection error', false);
    }

    function handleSocketMessage(event) {
        try {
            let data;

            if (event.data instanceof Blob) {
                const reader = new FileReader();

                reader.onload = function () {
                    try {
                        const jsonData = JSON.parse(reader.result);
                        processIncomingData(jsonData);
                    } catch (error) {
                        console.error('Error parsing Blob data as JSON:', error);
                    }
                };

                reader.onerror = function () {
                    console.error('Error reading Blob data:', reader.error);
                };

                reader.readAsText(event.data);
            } else {
                try {
                    data = JSON.parse(event.data);

                    if (Array.isArray(data)) {
                        data.forEach((userData) => {
                            processIncomingData(userData);
                        });
                    } else {
                        processIncomingData(data);
                    }
                } catch (error) {
                    console.error('Error parsing text data as JSON:', error, event.data);
                }
            }
        } catch (error) {
            console.error('Error in onmessage handler:', error);
        }
    }

    function processIncomingData(data) {
        if (!data || typeof data !== 'object') {
            console.error('Invalid data format:', data);
            return;
        }

        if (data.type === 'disconnect') {
            if (data.userId) {
                removeUserMarker(data.userId);
            }
            return;
        }

        if (data.userId && data.lat !== undefined && data.lng !== undefined) {
            updateUserMarker(data);
        } else {
            console.error('Missing required location data:', data);
        }
    }

    function login(username, password) {
        loginError.style.display = 'none';
        loginError.textContent = '';

        fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username: username, password: password }),
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Invalid username or password');
                }
                return response.json();
            })
            .then((data) => {
                localStorage.setItem('token', data.token);
                currentUserId = data.user.id;

                showApp();
                connectWebSocket(data.token);
            })
            .catch((error) => {
                showError(error.message);
            });
    }

    function logout() {
        stopWatchingPosition();
        localStorage.removeItem('token');
        currentUserId = null;

        if (socket) {
            socket.close();
            socket = null;
        }

        clearAllMarkers();
        showLogin();
    }

    function showError(message) {
        loginError.textContent = message;
        loginError.style.display = 'block';
    }

    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        if (username && password) {
            login(username, password);
        } else {
            showError('Please enter both username and password');
        }
    });

    logoutButton.addEventListener('click', logout);

    startTrackingBtn.addEventListener('click', startWatchingPosition);

    stopTrackingBtn.addEventListener('click', stopWatchingPosition);

    recenterMapBtn.addEventListener('click', function () {
        if (lastKnownPosition) {
            map.setView(lastKnownPosition, 15);
        } else if (userMarkers.size > 0) {
            const firstMarker = userMarkers.values().next().value;
            map.setView(firstMarker.marker.getLatLng(), 15);
        }
    });

    if (showLocationCheckbox) {
        showLocationCheckbox.addEventListener('change', function () {
            if (lastPositionData) {
                lastPositionData.showLocationToEveryone = this.checked;

                if (socket && socket.readyState === WebSocket.OPEN) {
                    const visibilityUpdate = {
                        userId: currentUserId,
                        type: 'visibility',
                        showLocationToEveryone: this.checked,
                    };

                    socket.send(JSON.stringify(visibilityUpdate));

                    if (lastPositionData.lat && lastPositionData.lng) {
                        sendLocationUpdate(lastPositionData);
                        pendingLocationUpdate = false;
                    }
                }
            }
        });
    }

    window.addEventListener('beforeunload', function () {
        stopWatchingPosition();

        if (socket && socket.readyState === WebSocket.OPEN && currentUserId) {
            socket.send(
                JSON.stringify({
                    userId: currentUserId,
                    type: 'disconnect',
                })
            );
        }
    });

    setInterval(updateUsersList, 10000);

    setInterval(function () {
        const now = Date.now();
        const staleTimeout = 5 * 60 * 1000;

        userMarkers.forEach((markerData, userId) => {
            if (userId !== currentUserId && now - markerData.lastUpdated > staleTimeout) {
                removeUserMarker(userId);
            }
        });
    }, 60000);

    checkAuth();
});
