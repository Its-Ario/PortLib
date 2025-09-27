import { LitElement, html, css } from 'lit';
import { saveAuthToken, removeAuthToken, getAuthToken } from '../utils/auth.js';
import { globalStyles } from '../styles/global-styles.js';
import { buttonStyles } from '../styles/button-styles.js';

export class LoginView extends LitElement {
    static properties = {
        loading: { type: Boolean },
        error: { type: String },
    };

    static styles = [
        globalStyles,
        buttonStyles,
        css`
            #login-container {
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background: linear-gradient(
                    135deg,
                    var(--primary-color) 0%,
                    var(--primary-dark) 100%
                );
                padding: 1rem;
            }

            .login-card {
                background: var(--surface);
                padding: 2.5rem;
                border-radius: 16px;
                box-shadow: var(--shadow-xl);
                width: 100%;
                max-width: 420px;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
            }

            .login-card h2 {
                text-align: center;
                margin-bottom: 2rem;
                color: var(--text-primary);
                font-weight: 700;
                font-size: 1.75rem;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.75rem;
            }

            .login-card h2 i {
                color: var(--primary-color);
                font-size: 1.5rem;
            }

            .input-group {
                margin-bottom: 1.5rem;
                position: relative;
            }

            .input-group label {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-bottom: 0.75rem;
                font-weight: 600;
                color: var(--text-primary);
                font-size: 0.875rem;
            }

            .input-group label i {
                color: var(--primary-color);
                width: 16px;
            }

            .input-group input {
                width: 100%;
                padding: 0.875rem 1rem;
                border: 2px solid var(--border);
                border-radius: 8px;
                font-size: 1rem;
                transition: all 0.2s ease;
                background: var(--surface);
            }

            .input-group input:focus {
                outline: none;
                border-color: var(--primary-color);
                box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
                background: #fefefe;
            }

            .error-message {
                color: var(--danger-color);
                margin-top: 1rem;
                text-align: center;
                font-weight: 500;
                background: rgba(239, 68, 68, 0.1);
                padding: 0.75rem;
                border-radius: 8px;
                border: 1px solid rgba(239, 68, 68, 0.2);
            }

            @keyframes spin {
                from {
                    transform: rotate(0deg);
                }

                to {
                    transform: rotate(360deg);
                }
            }

            @keyframes pulse {
                0% {
                    transform: translate(-50%, -50%) scale(0.8);
                    opacity: 0.8;
                }

                100% {
                    transform: translate(-50%, -50%) scale(2);
                    opacity: 0;
                }
            }

            @media (max-width: 768px) {
                .login-card {
                    padding: 2rem;
                    margin: 1rem;
                }
            }

            @media (prefers-color-scheme: dark) {
                :root {
                    --background: #0f172a;
                    --surface: #1e293b;
                    --surface-alt: #334155;
                    --text-primary: #f1f5f9;
                    --text-secondary: #cbd5e1;
                    --border: #334155;
                    --border-light: #475569;
                }

                .login-card {
                    background: var(--surface);
                    border: 1px solid var(--border);
                }

                .input-group input {
                    background: var(--surface-alt);
                    color: var(--text-primary);
                    border-color: var(--border);
                }

                .input-group input:focus {
                    background: var(--surface);
                }
            }
        `,
    ];

    constructor() {
        super();
        this.loading = false;
        this.error = '';
        this.attemptAutoLogin();
    }

    render() {
        return html`
            <div id="login-container">
                <div class="login-card">
                    <h2><i class="fas fa-map-marker-alt"></i> Shared Location Map</h2>
                    <form @submit=${this.handleSubmit}>
                        <div class="input-group">
                            <label for="username"><i class="fas fa-user"></i> Username:</label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                required
                                autocomplete="username"
                            />
                        </div>
                        <div class="input-group">
                            <label for="password"><i class="fas fa-lock"></i> Password:</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                required
                                autocomplete="current-password"
                            />
                        </div>
                        <button ?disabled=${this.loading} type="submit" class="btn-primary">
                            ${this.loading
                                ? html`<i class="fas fa-spinner fa-spin"></i> Logging in...`
                                : 'Login'}
                        </button>
                        ${this.error ? html`<div class="error-message">${this.error}</div>` : ''}
                        <a class="button google" href="/api/login/federated/google">Sign in with Google</a>
                    </form>
                </div>
            </div>
        `;
    }

    async handleSubmit(e) {
        e.preventDefault();
        this.loading = true;
        this.error = '';

        const username = this.renderRoot.querySelector('#username')?.value.trim();
        const password = this.renderRoot.querySelector('#password')?.value.trim();

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (!res.ok) throw new Error('Invalid username or password');

            const data = await res.json();

            if (data.token) saveAuthToken(data.token);

            this.dispatchEvent(
                new CustomEvent('login-success', {
                    detail: { user: data.user },
                    bubbles: true,
                    composed: true,
                })
            );
        } catch (err) {
            this.error = err.message;
            console.error(err);
        } finally {
            this.loading = false;
        }
    }

    async attemptAutoLogin() {
        const token = getAuthToken();
        if (!token) return;

        try {
            const res = await fetch(`api/verify-token`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Token invalid');

            const data = await res.json();
            this.dispatchEvent(
                new CustomEvent('login-success', {
                    detail: { user: data.user },
                    bubbles: true,
                    composed: true,
                })
            );
        } catch (err) {
            console.error('Auto-login failed', err);
            removeAuthToken();
        }
    }
}

if (!customElements.get('login-view')) {
    customElements.define('login-view', LoginView);
}
