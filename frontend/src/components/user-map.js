import { LitElement, html, css } from 'lit';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { globalStyles } from '../styles/global-styles';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    iconRetinaUrl: iconRetina,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

let CurrentUserIcon = L.icon({
    iconUrl: icon,
    iconRetinaUrl: iconRetina,
    shadowUrl: iconShadow,
    iconSize: [30, 48],
    iconAnchor: [15, 48],
    popupAnchor: [1, -40],
    tooltipAnchor: [16, -28],
    shadowSize: [48, 48],
    className: 'current-user-marker',
});

export class UserMap extends LitElement {
    static properties = {
        markers: { type: Object },
        currentUser: { type: String },
    };

    static styles = [
        globalStyles,
        css`
            :host {
                display: block;
                width: 100%;
                height: 100%;
            }

            #map {
                height: 100%;
                width: 100%;
                z-index: 1;
                border-radius: inherit;
            }

            :host ::ng-deep .current-user-marker {
                filter: hue-rotate(120deg) brightness(1.2);
            }

            .map-loading {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 1000;
                background: rgba(255, 255, 255, 0.9);
                padding: 1rem 2rem;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                display: flex;
                align-items: center;
                gap: 0.75rem;
                font-weight: 500;
                color: var(--text-primary);
            }

            .loading-spinner {
                width: 20px;
                height: 20px;
                border: 2px solid var(--border);
                border-top: 2px solid var(--primary-color);
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            @keyframes spin {
                0% {
                    transform: rotate(0deg);
                }
                100% {
                    transform: rotate(360deg);
                }
            }

            :host ::ng-deep .leaflet-control-container {
                font-family: inherit;
            }

            :host ::ng-deep .leaflet-popup-content-wrapper {
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }

            :host ::ng-deep .leaflet-popup-content {
                font-family: inherit;
                font-weight: 500;
                color: var(--text-primary);
            }
        `,
    ];

    constructor() {
        super();
        this.map = null;
        this.markers = new Map();
        this.currentUser = null;
        this.isLoading = true;
    }

    render() {
        return html`
            ${this.isLoading
                ? html`
                      <div class="map-loading">
                          <div class="loading-spinner"></div>
                          Loading map...
                      </div>
                  `
                : ''}
            <div id="map"></div>
        `;
    }

    firstUpdated() {
        this.initializeMap();
    }

    async initializeMap() {
        try {
            this.map = L.map(this.renderRoot.querySelector('#map'), {
                zoomControl: true,
                attributionControl: true,
                preferCanvas: true,
            }).setView([35.7, 51.4], 13);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution:
                    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19,
                tileSize: 256,
                zoomOffset: 0,
            }).addTo(this.map);

            this.map.on('click', (e) => {
                this.dispatchEvent(
                    new CustomEvent('map-click', {
                        detail: { lat: e.latlng.lat, lng: e.latlng.lng },
                        bubbles: true,
                        composed: true,
                    })
                );
            });

            this.map.whenReady(() => {
                this.isLoading = false;
                this.requestUpdate();

                this.dispatchEvent(
                    new CustomEvent('map-ready', {
                        bubbles: true,
                        composed: true,
                    })
                );
            });
        } catch (error) {
            console.error('Failed to initialize map:', error);
            this.isLoading = false;
            this.requestUpdate();
        }
    }

    upsertMarker(username, lat, lng, isCurrentUser = false) {
        if (!this.map) return;

        if (this.markers.has(username)) {
            this.markers.get(username).setLatLng([lat, lng]);
        } else {
            const icon = isCurrentUser ? CurrentUserIcon : DefaultIcon;
            const marker = L.marker([lat, lng], { icon }).addTo(this.map).bindPopup(`
                    <div style="text-align: center;">
                        <strong>${username}</strong>
                        ${isCurrentUser ? '<br><small>(You)</small>' : ''}
                        <br><small>Lat: ${lat.toFixed(6)}</small>
                        <br><small>Lng: ${lng.toFixed(6)}</small>
                    </div>
                `);

            this.markers.set(username, marker);

            marker.on('click', () => {
                this.dispatchEvent(
                    new CustomEvent('marker-click', {
                        detail: { username, lat, lng, isCurrentUser },
                        bubbles: true,
                        composed: true,
                    })
                );
            });
        }
    }

    removeMarker(username) {
        const marker = this.markers.get(username);
        if (marker && this.map) {
            this.map.removeLayer(marker);
            this.markers.delete(username);
        }
    }

    clearMarkers() {
        this.markers.forEach((marker) => {
            if (this.map) {
                this.map.removeLayer(marker);
            }
        });
        this.markers.clear();
    }

    focusLocation(lat, lng, username = null, zoom = 16) {
        if (!this.map) return;

        this.map.setView([lat, lng], zoom, {
            animate: true,
            duration: 1,
        });

        if (username && this.markers.has(username)) {
            this.markers.get(username).openPopup();
        }
    }

    fitToMarkers() {
        if (!this.map || this.markers.size === 0) return;

        const group = new L.featureGroup(Array.from(this.markers.values()));
        this.map.fitBounds(group.getBounds().pad(0.1), {
            animate: true,
            duration: 1,
        });
    }

    getCenter() {
        if (!this.map) return null;
        const center = this.map.getCenter();
        return { lat: center.lat, lng: center.lng };
    }

    getZoom() {
        if (!this.map) return null;
        return this.map.getZoom();
    }

    setCurrentUser(username) {
        this.currentUser = username;
    }

    isReady() {
        return this.map && !this.isLoading;
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
    }
}

customElements.define('user-map', UserMap);
