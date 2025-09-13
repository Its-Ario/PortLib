import { css } from 'lit';

export const buttonStyles = css`
    button {
        cursor: pointer;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        font-family: inherit;
    }

    .btn-primary {
        background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
        color: white;
        padding: 0.75rem 1.5rem;
        box-shadow: var(--shadow);
    }

    .btn-primary:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
    }

    .btn-primary:disabled {
        background: var(--secondary-color);
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
        opacity: 0.7;
    }

    .btn-primary:disabled .fa-spinner {
        animation: spin 1s linear infinite;
    }
`;
