import { GeolocationService } from './services/geolocation-service.js';
import { CollaborationService } from './services/collaboration-service.js';
import { saveAuthToken } from './utils/auth.js';
import './components/app-view.js';

document.addEventListener('DOMContentLoaded', () => {
    const app = document.querySelector('#app');
    const geoService = new GeolocationService();
    const collabService = new CollaborationService();

    let currentUser = null;
    let showLocation = true;
    let isFirstLocationUpdate = false;

    app.addEventListener('login-success', (e) => {
        currentUser = e.detail.user;
        saveAuthToken(currentUser.token);
        app.map?.setCurrentUser(currentUser.id);
        collabService.connect('map', currentUser);
    });

    app.addEventListener('toggle-tracking', (e) => {
        e.detail.isTracking ? geoService.start() : geoService.stop();
    });

    app.addEventListener('toggle-show-location', (e) => {
        showLocation = e.detail.showLocation;
        const map = app.map;

        if (!showLocation) {
            collabService.removeCurrentUser();
            if (map) {
                map.removeMarker(currentUser.id);
            }
        } else {
            collabService.updateUserLocation({
                lat: app.currentCoordinates.lat,
                lng: app.currentCoordinates.lng,
                accuracy: 20,
            });
        }

        app.updateShowLocation(showLocation);
    });

    geoService.addEventListener('location-update', (e) => {
        const { lat, lng, accuracy } = e.detail;
        app.updateCoordinates(lat, lng);
        if (showLocation) {
            collabService.updateUserLocation({ lat, lng, accuracy });
        }

        if (isFirstLocationUpdate && app.map) {
            app.map.focusLocation(lat, lng, currentUser.id);
            isFirstLocationUpdate = false;
        }
    });

    geoService.addEventListener('tracking-started', () => {
        app.updateTracking(true);
        isFirstLocationUpdate = true;
    });
    geoService.addEventListener('tracking-stopped', () => {
        app.updateTracking(false);
        isFirstLocationUpdate = false;
        collabService.removeCurrentUser();
    });

    geoService.addEventListener('error', (e) => alert(e.detail));

    collabService.addEventListener('connection-status', (e) =>
        app.updateConnectionStatus(e.detail)
    );

    collabService.addEventListener('users-changed', (e) => {
        const users = e.detail;
        const map = app.map;

        app.updateUsers(users);

        if (map && map.isReady()) {
            users.forEach((u) => {
                if (u.lat !== undefined && u.lng !== undefined) {
                    map.upsertMarker(
                        u.userDetails,
                        u.lat,
                        u.lng,
                        u.lastUpdated,
                        u.current,
                        u.accuracy
                    );
                }
            });

            const currentUsers = new Set(users.map((u) => u.userDetails.id));
            map.markers.forEach((marker, id) => {
                if (!currentUsers.has(id)) {
                    map.removeMarker(id);
                }
            });
        }
    });
});
