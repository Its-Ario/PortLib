# `<app-view>` Component

The **`<app-view>`** component is the **root container** of the PortLib frontend application.  
It manages **authentication, layout, and communication** between the main sub-components:

- [`<login-view>`](./login-view.md) (login form)
- [`<header-bar>`](./header-bar.md) (top navigation / logout)
- [`<user-map>`](./user-map.md) (Leaflet map of online users)
- [`<user-list>`](./user-list.md) (list of connected users and controls)

This component is responsible for switching between the login screen and the main application once the user is authenticated.

## Example Usage

```html
<app-view></app-view>
```

The component should be included once in the root of the application.

## Properties

| Property              | Type             | Default             | Description                                                                    |
| --------------------- | ---------------- | ------------------- | ------------------------------------------------------------------------------ |
| `currentUser`         | `object \| null` | `null`              | The currently authenticated user object.                                       |
| `users`               | `Array<object>`  | `[]`                | Array of online users displayed in `<user-list>`.                              |
| `isTracking`          | `boolean`        | `false`             | Whether the current user’s location is being tracked.                          |
| `showLocation`        | `boolean`        | `true`              | Controls whether the user’s location is visible to others.                     |
| `currentCoordinates`  | `object`         | `{ lat: 0, lng: 0}` | The current user’s latitude and longitude.                                     |
| `connectionStatus`    | `string`         | `"disconnected"`    | Status of the realtime connection (`connected`, `connecting`, `disconnected`). |
| `map` (readonly)      | `HTMLElement`    | `null`              | Reference to the internal `<user-map>` element.                                |
| `userList` (readonly) | `HTMLElement`    | `null`              | Reference to the internal `<user-list>` element.                               |

## Methods

| Method                           | Parameters       | Description                                             |
| -------------------------------- | ---------------- | ------------------------------------------------------- |
| `updateUsers(usersArr)`          | `Array<object>`  | Updates the online users list.                          |
| `updateTracking(value)`          | `boolean`        | Enables/disables location tracking.                     |
| `updateShowLocation(value)`      | `boolean`        | Updates whether the current user shares their location. |
| `updateCoordinates(lat, lng)`    | `number, number` | Updates the user’s current coordinates.                 |
| `updateConnectionStatus(status)` | `string`         | Updates the connection status string.                   |

## Events

| Event                  | Detail Payload                 | Description                                                        |
| ---------------------- | ------------------------------ | ------------------------------------------------------------------ |
| `login-success`        | `{ user: object }`             | Fired when login succeeds; contains the authenticated user object. |
| `logout`               | —                              | Fired when the user logs out.                                      |
| `map-click`            | `{ lat: number, lng: number }` | Fired when the map is clicked.                                     |
| `toggle-tracking`      | `{ enabled: boolean }`         | Fired when the tracking toggle changes.                            |
| `toggle-show-location` | `{ enabled: boolean }`         | Fired when the "show location" option changes.                     |
| `focus-user`           | `{ user: object }`             | Fired when a user in the list is focused (centers map on them).    |

## Internal Structure

When logged in, the DOM layout looks like this:

```html
<div class="app-container">
    <header-bar></header-bar>
    <div class="content">
        <div class="map-container">
            <user-map></user-map>
        </div>
        <div class="user-list-container">
            <user-list></user-list>
        </div>
    </div>
</div>
```

## Notes

- `<app-view>` controls **authentication state**. If `currentUser` is `null`, it renders `<login-view>`.
- It acts as the **single source of truth** for `users`, `tracking`, `connectionStatus`, and passes them down to child components.
- It uses **custom events** to bubble up actions (login, logout, map clicks, toggles) so that a parent app or controller can listen to them.

## Best Practices

- Always listen for `login-success` and `logout` events at the application root to update global state.
- Do not modify `map` or `userList` directly; use the provided `update*` methods or bind properties.
- Use CSS custom properties (`--background`, `--surface`, `--border`) to theme the component consistently.
