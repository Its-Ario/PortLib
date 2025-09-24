import { LitElement, html, css } from 'lit';

export class HeaderBar extends LitElement {
    static properties = {
        user: { type: Object },
    };

    static styles = css`
        :host {
            display: block;
        }
        .username {
            font-weight: bold;
        }
        button {
            cursor: pointer;
            border-radius: 8px;
            font-weight: 600;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            font-family: inherit;
            background: transparent;
            color: white;
            border: 2px solid rgba(255, 255, 255, 0.3);
            padding: 0.5rem 1rem;
            backdrop-filter: blur(10px);
        }
        button:hover {
            background: rgba(255, 255, 255, 0.1);
            border-color: rgba(255, 255, 255, 0.5);
            transform: translateY(-1px);
        }

        .container {
            background: #334155;
            color: white;
            padding: 1rem 1.5rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: var(--shadow);
            position: relative;
            z-index: 1000;
        }

        .container h1 {
            font-size: 1.5rem;
            font-weight: 700;
            margin: 0;
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .container h1 i button {
            color: var(--primary-color);
        }

        @keyframes spin {
            from {
                transform: rotate(0deg);
            }

            to {
                transform: rotate(360deg);
            }
        }
    `;

    constructor() {
        super();
        this.user = null;
    }

    render() {
        return html`
            <div class="container">
                <div class="username">${this.user?.name ? `Welcome, ${this.user.name}` : ''}</div>
                <h1><i class="fas fa-map-marker-alt"></i>PortLib Location Map</h1>
                <button @click=${this._onLogout}>Logout</button>
            </div>
        `;
    }

    _onLogout() {
        this.dispatchEvent(
            new CustomEvent('logout', {
                bubbles: true,
                composed: true,
            })
        );
    }
}

customElements.define('header-bar', HeaderBar);
