export class GeolocationService extends EventTarget {
    constructor() {
        super();
        this.watchId = null;
        this.isTracking = false;
    }

    start(options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }) {
        if (!this._checkSupport()) return;
        if (this.isTracking) return;

        this.isTracking = true;
        this.dispatchEvent(new CustomEvent('tracking-started'));

        this.watchId = navigator.geolocation.watchPosition(
            (pos) => this._handleSuccess(pos),
            (err) => {
                this._handleError(err);
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
        if (this.isTracking) {
            this.isTracking = false;
            this.dispatchEvent(new CustomEvent('tracking-stopped'));
        }
    }

    getCurrentPosition(options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }) {
        return new Promise((resolve, reject) => {
            if (!this._checkSupport()) {
                reject('Geolocation is not supported by your browser.');
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve(this._formatPosition(pos)),
                (err) => reject(this._formatError(err), options)
            );
        });
    }

    _handleSuccess(pos) {
        this.dispatchEvent(
            new CustomEvent('location-update', {
                detail: this._formatPosition(pos),
            })
        );
    }

    _handleError(error) {
        this.dispatchEvent(new CustomEvent('error', { detail: this._formatError(error) }));
    }

    _formatPosition(pos) {
        const { latitude, longitude, accuracy } = pos.coords;
        return { lat: latitude, lng: longitude, accuracy };
    }

    _formatError(error) {
        switch (error.code) {
            case error.PERMISSION_DENIED:
                return 'Location access was denied. Please allow location access and try again.';
            case error.POSITION_UNAVAILABLE:
                return 'Location information is unavailable. Check your network or GPS signal.';
            case error.TIMEOUT:
                return 'The request to get user location timed out.';
            default:
                return 'An unknown error occurred while trying to get your location.';
        }
    }

    _checkSupport() {
        const supported = 'geolocation' in navigator;
        if (!supported) {
            this.dispatchEvent(
                new CustomEvent('error', { detail: 'Geolocation is not supported.' })
            );
        }
        return supported;
    }
}
