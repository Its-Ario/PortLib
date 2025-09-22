# `<user-list>` Component

The `<user-list>` component displays connected users and provides controls for tracking and sharing location.  
It integrates with the real-time map to show or hide user positions.

## Properties

| Property             | Type      | Default             | Description                          |
| -------------------- | --------- | ------------------- | ------------------------------------ |
| `currentCoordinates` | `object`  | `{"lat":0,"lng":0}` | Current latitude and longitude       |
| `isTracking`         | `boolean` | `false`             | Whether location tracking is enabled |
| `showLocation`       | `boolean` | `true`              | Whether to show the user’s location  |
| `users`              | `never[]` | `[]`                | Array of connected users             |

## Methods

| Method               | Type                         | Description                               |
| -------------------- | ---------------------------- | ----------------------------------------- |
| `updateCoordinates`  | `(lat: any, lng: any): void` | Updates the current user’s coordinates    |
| `updateShowLocation` | `(showLocation: any): void`  | Toggles visibility of user’s own location |
| `updateTracking`     | `(isTracking: any): void`    | Updates the tracking state                |

## Events

| Event                  | Type                                    | Description                                       |
| ---------------------- | --------------------------------------- | ------------------------------------------------- |
| `focus-user`           | `CustomEvent<{ user: any; }>`           | Fired when a user in the list is selected         |
| `toggle-show-location` | `CustomEvent<{ showLocation: any; }>`   | Fired when the show/hide location setting changes |
| `toggle-tracking`      | `CustomEvent<{ isTracking: boolean; }>` | Fired when tracking is toggled                    |

---

## Usage Example

```html
<user-list
    .users="${users}"
    .isTracking="${isTracking}"
    .showLocation="${showLocation}"
    .currentCoordinates="${coords}"
    @focus-user="${onFocusUser}"
    @toggle-show-location="${onToggleShowLocation}"
    @toggle-tracking="${onToggleTracking}"
>
</user-list>
```

```js
function onFocusUser(e) {
    console.log('Focused user:', e.detail.user);
}

function onToggleShowLocation(e) {
    console.log('Show location:', e.detail.showLocation);
}

function onToggleTracking(e) {
    console.log('Tracking state:', e.detail.isTracking);
}
```

## Behavior

- **Tracking Control:**
  The toggle button starts or stops location tracking. Emits `toggle-tracking`.

- **Show Location Toggle:**
  Checkbox lets user hide their location from others. Emits `toggle-show-location`.

- **User List:**
  Displays connected users with `lastUpdated` timestamps.
  Clicking a user fires `focus-user` to center the map.

- **Coordinates Display:**
  Shows the current user’s coordinates if `showLocation` is `true`; otherwise displays “Location hidden”.
