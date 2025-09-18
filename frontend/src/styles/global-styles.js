import { css } from 'lit';

export const globalStyles = css`
    * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    :host {
        background: var(--background, #fff);
        color: var(--text-primary, #000);
        line-height: 1.6;
        font-size: 14px;
    }

    ::-webkit-scrollbar {
        width: 8px;
    }

    ::-webkit-scrollbar-track {
        background: var(--surface-alt);
    }

    ::-webkit-scrollbar-thumb {
        background: var(--secondary-color);
        border-radius: 4px;
    }

    ::-webkit-scrollbar-thumb:hover {
        background: #475569;
    }
`;
