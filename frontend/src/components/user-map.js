import { LitElement, html, css, unsafeCSS } from 'lit';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { globalStyles } from '../styles/global-styles';
import leafletStyles from 'leaflet/dist/leaflet.css?inline';

export class UserMap extends LitElement {
    static properties = {
        markers: { type: Object },
        currentUser: { type: String },
    };

    static styles = [
        globalStyles,
        css`
            ${unsafeCSS(leafletStyles)}
        `,
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

            :host .current-user-marker {
                filter: hue-rotate(120deg) brightness(1.2);
            }

            .user-dot {
                background-color: #667eea; /* Indigo */
                width: 16px;
                height: 16px;
                border-radius: 50%;
                border: 3px solid #ffffff;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                transition: transform 0.2s ease-in-out;
                cursor: pointer;
            }
            .user-dot:hover {
                transform: scale(1.2);
            }

            .current-user-dot {
                background-color: #22c55e; /* Green */
                width: 18px;
                height: 18px;
                border: 3px solid #ffffff;
                border-radius: 50%;
                box-shadow: 0 3px 12px rgba(0, 0, 0, 0.4);
                z-index: 10;
            }

            .current-user-dot::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 100%;
                height: 100%;
                border-radius: 50%;
                background-color: transparent;
                border: 3px solid rgba(34, 197, 94, 0.7);
                animation: pulse 1.5s ease-out infinite;
                z-index: -1;
            }

            @keyframes pulse {
                0% {
                    transform: translate(-50%, -50%) scale(0.5);
                    opacity: 1;
                }
                100% {
                    transform: translate(-50%, -50%) scale(2.5);
                    opacity: 0;
                }
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

            :host .leaflet-control-container {
                font-family: inherit;
            }

            :host .leaflet-popup-content-wrapper {
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }

            :host .leaflet-popup-content {
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

    upsertMarker(username, lat, lng, isCurrentUser = false, accuracy = 20) {
        if (!this.map) return;

        if (this.markers.has(username)) {
            const { marker, circle } = this.markers.get(username);
            marker.setLatLng([lat, lng]);
            if (circle) circle.setLatLng([lat, lng]).setRadius(accuracy);
        } else {
            const dotIcon = L.divIcon({
                className: isCurrentUser ? 'current-user-dot' : 'user-dot',
                iconSize: [12, 12],
                iconAnchor: [6, 6],
            });

            const marker = L.marker([lat, lng], { icon: dotIcon }).addTo(this.map).bindPopup(`
                <div style="text-align:center;">
                    <strong>${username}</strong>
                    ${isCurrentUser ? '<br><small>(You)</small>' : ''}
                    <br><small>Lat: ${lat.toFixed(6)}</small>
                    <br><small>Lng: ${lng.toFixed(6)}</small>
                </div>
            `);

            const accuracyCircle = L.circle([lat, lng], {
                radius: accuracy,
                color: isCurrentUser ? '#22c55e' : '#667eea',
                opacity: 0.2,
                fillOpacity: 0.1,
                weight: 1,
            }).addTo(this.map);

            this.markers.set(username, { marker, circle: accuracyCircle });

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
