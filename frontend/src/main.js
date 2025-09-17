import './components/app-view.js';
import { saveAuthToken, removeAuthToken } from './utils/auth.js';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import * as awarenessProtocol from 'y-protocols/awareness.js';

document.addEventListener('DOMContentLoaded', () => {
    const app = document.querySelector('#app');

    const doc = new Y.Doc();
    const yUsers = doc.getMap('users');
    let provider = null;
    let watchId = null;
    let currentUserId = null;
    let isTracking = false;
    let showLocation = true;

    function initializeProvider() {
        if (provider) provider.destroy();

        provider = new WebrtcProvider('map-room', doc, {
            signaling: ['wss://lib.itsario.ir/api/'],
            awareness: new awarenessProtocol.Awareness(doc),
        });

        provider.on('synced', () => {
            console.log('Provider synced');
            app.updateConnectionStatus('connected');
        });

        provider.on('connection-error', (e) => {
            console.error('Yjs connection error', e);
            app.updateConnectionStatus('disconnected');
        });

        provider.on('status', (event) => {
            if (event.status === 'connecting') {
                app.updateConnectionStatus('connecting');
            } else if (event.status === 'connected') {
                app.updateConnectionStatus('connected');
            } else {
                app.updateConnectionStatus('disconnected');
            }
        });
    }

    app.addEventListener('login-success', async (e) => {
        const user = e.detail.user;
        currentUserId = user.id || user._id;
        saveAuthToken(user.token);

        const map = app.map;
        if (map) {
            map.setCurrentUser(user.username);
        }

        initializeProvider();
    });

    app.addEventListener('logout', () => {
        stopWatchingPosition();
        if (provider) provider.destroy();
        provider = null;

        const map = app.map;
        if (map) {
            map.clearMarkers();
        }
        yUsers.clear();

        removeAuthToken();
        currentUserId = null;
        isTracking = false;
        showLocation = true;
    });

    app.addEventListener('toggle-tracking', (e) => {
        const shouldTrack = e.detail.isTracking;
        if (shouldTrack) {
            startWatchingPosition();
        } else {
            stopWatchingPosition();
        }
    });

    app.addEventListener('toggle-show-location', (e) => {
        showLocation = e.detail.showLocation;
        app.updateShowLocation(showLocation);
    });

    yUsers.observe(() => {
        const usersArray = Array.from(yUsers.entries()).map(([userId, data]) => ({
            username: data.username || userId,
            lastSeen: data.timestamp ? new Date(data.timestamp).toLocaleTimeString() : 'Unknown',
            current: userId === currentUserId,
            lat: data.lat,
            lng: data.lng,
        }));

        app.updateUsers(usersArray);

        const map = app.map;
        if (map && map.isReady()) {
            usersArray.forEach((u) => {
                if (u.lat !== undefined && u.lng !== undefined) {
                    map.upsertMarker(u.username, u.lat, u.lng, u.current);
                }
            });

            const currentUsernames = new Set(usersArray.map((u) => u.username));
            map.markers.forEach((marker, username) => {
                if (!currentUsernames.has(username)) {
                    map.removeMarker(username);
                }
            });
        }
    });

    function startWatchingPosition() {
        if (!navigator.geolocation) {
            alert('Geolocation not supported');
            return;
        }

        if (isTracking) return;
        isTracking = true;
        app.updateTracking(true);

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 30000,
        };

        watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude, accuracy } = pos.coords;

                app.updateCoordinates(latitude, longitude);

                if (currentUserId && showLocation) {
                    yUsers.set(currentUserId, {
                        userId: currentUserId,
                        username: app.currentUser.username,
                        lat: latitude,
                        lng: longitude,
                        accuracy,
                        visible: true,
                        timestamp: Date.now(),
                    });
                }

                const map = app.map;
                if (
                    map &&
                    map.isReady() &&
                    map.getCenter() &&
                    Math.abs(map.getCenter().lat - 35.7) < 0.1
                ) {
                    map.focusLocation(latitude, longitude, null, 15);
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                let message = 'Location access failed. ';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        message += 'Please allow location access and try again.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message += 'Location information is unavailable.';
                        break;
                    case error.TIMEOUT:
                        message += 'Location request timed out.';
                        break;
                    default:
                        message += 'An unknown error occurred.';
                        break;
                }
                alert(message);
                stopWatchingPosition();
            },
            options
        );
    }

    function stopWatchingPosition() {
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
            watchId = null;
        }

        isTracking = false;
        app.updateTracking(false);

        if (currentUserId) {
            yUsers.delete(currentUserId);
        }
    }

    app.addEventListener('map-ready', () => {
        console.log('Map is ready');
    });
});
