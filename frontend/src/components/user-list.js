import { LitElement, html, css } from 'lit';
import { globalStyles } from '../styles/global-styles';

export class UserList extends LitElement {
    static properties = {
        users: { type: Array },
        isTracking: { type: Boolean },
        showLocation: { type: Boolean },
        currentCoordinates: { type: Object },
    };

    static styles = [
        globalStyles,
        css`
            :host {
                display: flex;
                flex-direction: column;
                height: 100%;
                background: var(--surface);
            }

            .map-controls {
                padding: 1.5rem;
                display: grid;
                grid-template-columns: auto 1fr auto auto;
                gap: 1rem;
                background: var(--surface);
                border-bottom: 1px solid var(--border);
                align-items: center;
            }

            .coordinates-display {
                padding: 0.75rem 1rem;
                background: var(--surface-alt);
                border-radius: 8px;
                border: 1px solid var(--border);
                font-family: 'Monaco', 'Menlo', monospace;
                font-size: 0.875rem;
                color: var(--text-secondary);
                display: flex;
                align-items: center;
                gap: 0.5rem;
                min-width: 200px;
            }

            .show-location-label {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                cursor: pointer;
                font-weight: 500;
                color: var(--text-secondary);
                white-space: nowrap;
                user-select: none;
            }

            .show-location-label input[type='checkbox'] {
                width: 18px;
                height: 18px;
                accent-color: var(--primary-color);
                cursor: pointer;
            }

            .toggle-button {
                position: relative;
                display: inline-flex;
                align-items: center;
                gap: 0.75rem;
                padding: 0.75rem 1.25rem;
                border-radius: 12px;
                font-weight: 600;
                font-size: 0.875rem;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                cursor: pointer;
                border: none;
                overflow: hidden;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                min-width: 140px;
                justify-content: center;
            }

            .toggle-button::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(
                    45deg,
                    transparent 30%,
                    rgba(255, 255, 255, 0.1) 50%,
                    transparent 70%
                );
                transform: translateX(-100%);
                transition: transform 0.6s ease;
            }

            .toggle-button:hover::before {
                transform: translateX(100%);
            }

            .toggle-button.start-state {
                background: linear-gradient(135deg, var(--success-color) 0%, #059669 100%);
                color: white;
                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
            }

            .toggle-button.start-state:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
            }

            .toggle-button.stop-state {
                background: linear-gradient(135deg, var(--danger-color) 0%, #dc2626 100%);
                color: white;
                box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
            }

            .toggle-button.stop-state:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
            }

            .toggle-button:disabled {
                background: var(--secondary-color) !important;
                color: white !important;
                cursor: not-allowed !important;
                transform: none !important;
                box-shadow: none !important;
                opacity: 0.7;
            }

            .user-info {
                padding: 1.5rem;
                overflow-y: auto;
                flex-grow: 1;
                background: var(--surface);
            }

            .user-info h3 {
                margin: 0 0 1.5rem 0;
                border-bottom: 2px solid var(--border-light);
                padding-bottom: 0.75rem;
                font-weight: 700;
                color: var(--text-primary);
                display: flex;
                align-items: center;
                gap: 0.75rem;
                font-size: 1.25rem;
            }

            .user-info h3 i {
                color: var(--primary-color);
            }

            .users-count {
                margin-bottom: 1.5rem;
                font-weight: 600;
                color: var(--text-secondary);
                background: var(--surface-alt);
                padding: 0.75rem 1rem;
                border-radius: 8px;
                border-left: 4px solid var(--primary-color);
                font-size: 0.9rem;
            }

            .users-list {
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
            }

            .user-item {
                padding: 1rem 1.25rem;
                background: var(--surface);
                border-radius: 12px;
                border: 1px solid var(--border);
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                overflow: hidden;
            }

            .user-item::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                width: 4px;
                height: 100%;
                background: var(--primary-color);
                transition: width 0.3s ease;
            }

            .user-item:hover {
                background: var(--surface-alt);
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                border-color: var(--primary-color);
            }

            .user-item:hover::before {
                width: 6px;
            }

            .user-item.current-user {
                border-color: var(--success-color);
                background: rgba(16, 185, 129, 0.05);
            }

            .user-item.current-user::before {
                background: var(--success-color);
            }

            .user-item.current-user:hover {
                background: rgba(16, 185, 129, 0.1);
                border-color: var(--success-color);
            }

            .username {
                font-weight: 600;
                color: var(--text-primary);
                font-size: 0.95rem;
            }

            .current-user .username::after {
                content: ' (You)';
                font-weight: 400;
                color: var(--success-color);
                font-size: 0.85rem;
            }

            .last-updated {
                font-size: 0.75rem;
                color: var(--text-secondary);
                font-weight: 400;
                display: block;
                margin-top: 0.25rem;
            }

            .empty-state {
                text-align: center;
                padding: 2rem;
                color: var(--text-secondary);
                font-style: italic;
            }

            @media (max-width: 768px) {
                .map-controls {
                    grid-template-columns: 1fr;
                    gap: 1rem;
                }

                .coordinates-display {
                    min-width: unset;
                }
            }
        `,
    ];

    constructor() {
        super();
        this.users = [];
        this.isTracking = false;
        this.showLocation = true;
        this.currentCoordinates = { lat: 0, lng: 0 };
    }

    render() {
        return html`
            <div class="map-controls">
                <button
                    class="toggle-button ${this.isTracking ? 'stop-state' : 'start-state'}"
                    @click=${this._toggleTracking}
                >
                    <i class="fas fa-${this.isTracking ? 'stop' : 'play'}"></i>
                    ${this.isTracking ? 'Stop Tracking' : 'Start Tracking'}
                </button>

                <div class="coordinates-display">
                    <i class="fas fa-map-marker-alt"></i>
                    ${this.showLocation
                        ? `${this.currentCoordinates.lat.toFixed(6)}, ${this.currentCoordinates.lng.toFixed(6)}`
                        : 'Location hidden'}
                </div>

                <label class="show-location-label">
                    <input
                        type="checkbox"
                        .checked=${this.showLocation}
                        @change=${this._toggleShowLocation}
                    />
                    Show my location
                </label>
            </div>

            <div class="user-info">
                <h3>
                    <i class="fas fa-users"></i>
                    Connected Users
                </h3>

                <div class="users-count">
                    ${this.users.length} user${this.users.length !== 1 ? 's' : ''} online
                </div>

                <div class="users-list">
                    ${this.users.length === 0
                        ? html`<div class="empty-state">No users connected</div>`
                        : this.users.map(
                              (user) => html`
                                  <div
                                      class="user-item ${user.current ? 'current-user' : ''}"
                                      @click=${() => this._focusUser(user)}
                                  >
                                      <div class="username">${user.userDetails.name}</div>
                                      <div class="last-updated">
                                          Last updated: ${user.lastUpdated}
                                      </div>
                                  </div>
                              `
                          )}
                </div>
            </div>
        `;
    }

    _toggleTracking() {
        this.dispatchEvent(
            new CustomEvent('toggle-tracking', {
                detail: { isTracking: !this.isTracking },
                bubbles: true,
                composed: true,
            })
        );
    }

    _toggleShowLocation(e) {
        const showLocation = e.target.checked;
        this.dispatchEvent(
            new CustomEvent('toggle-show-location', {
                detail: { showLocation },
                bubbles: true,
                composed: true,
            })
        );
    }

    _focusUser(user) {
        if (user.lat !== undefined && user.lng !== undefined) {
            this.dispatchEvent(
                new CustomEvent('focus-user', {
                    detail: { user },
                    bubbles: true,
                    composed: true,
                })
            );
        }
    }

    updateCoordinates(lat, lng) {
        this.currentCoordinates = { lat, lng };
    }

    updateTracking(isTracking) {
        this.isTracking = isTracking;
    }

    updateShowLocation(showLocation) {
        this.showLocation = showLocation;
    }
}

customElements.define('user-list', UserList);
