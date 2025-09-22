# `<login-view>` Component

The `<login-view>` component provides a secure authentication form for the PortLib application.  
It supports manual login with username and password, as well as automatic login using a stored JWT.

## Properties

| Property  | Type      | Default | Description                               |
| --------- | --------- | ------- | ----------------------------------------- |
| `error`   | `string`  | `""`    | Holds the current error message if any    |
| `loading` | `boolean` | `false` | Indicates if a login request is in-flight |

## Methods

| Method             | Type                      | Description                                   |
| ------------------ | ------------------------- | --------------------------------------------- |
| `attemptAutoLogin` | `(): Promise<void>`       | Attempts to log in with an existing JWT token |
| `handleSubmit`     | `(e: any): Promise<void>` | Handles login form submission                 |

## Events

| Event           | Type                          | Description                            |
| --------------- | ----------------------------- | -------------------------------------- |
| `login-success` | `CustomEvent<{ user: any; }>` | Fired when a user successfully logs in |

## Usage Example

```html
<login-view @login-success="${handleLogin}"></login-view>
```

```js
function handleLogin(e) {
    console.log('User logged in:', e.detail.user);
}
```

## Behavior

- **Form submission** sends a POST request to `/api/login` with credentials.
- On success, stores JWT token with `saveAuthToken()` and dispatches `login-success`.
- On failure, shows an error message in the UI.
- **Auto-login** runs on component initialization:
  - Reads JWT from local storage.
  - Verifies token at `GET /api/verify-token`.
  - If valid, dispatches `login-success`.
  - If invalid, removes stored token.
