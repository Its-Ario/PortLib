export class GeolocationService extends EventTarget {
    constructor() {
        super();
        this.watchId = null;
        this.isTracking = false;
    }

    start() {
        if (!navigator.geolocation) {
            this.dispatchEvent(
                new CustomEvent('error', {
                    detail: 'Geolocation is not supported by your browser.',
                })
            );
            return;
        }
        if (this.isTracking) return;

        this.isTracking = true;
        this.dispatchEvent(new CustomEvent('tracking-started'));

        const options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };

        this.watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude, accuracy } = pos.coords;
                this.dispatchEvent(
                    new CustomEvent('location-update', {
                        detail: { lat: latitude, lng: longitude, accuracy },
                    })
                );
            },
            (error) => {
                let message = 'Location access failed. ';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        message += 'Please allow location access and try again.';
                        break;
                    default:
                        message += 'An unknown error occurred.';
                        break;
                }
                this.dispatchEvent(new CustomEvent('error', { detail: message }));
                this.stop();
            },
            options
        );
    }

    stop() {
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
        this.isTracking = false;
        this.dispatchEvent(new CustomEvent('tracking-stopped'));
    }
}
