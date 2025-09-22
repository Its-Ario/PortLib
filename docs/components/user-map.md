# `<user-map>` Component

The `<user-map>` component renders an interactive map using Leaflet and displays connected users as markers.  
It supports focusing, adding, updating, and removing user markers with optional accuracy circles.

## Properties

| Property      | Type            | Default | Description                                 |
| ------------- | --------------- | ------- | ------------------------------------------- |
| `currentUser` | `string`        | `null`  | Username of the current user                |
| `isLoading`   | `boolean`       | `true`  | Indicates whether the map is still loading  |
| `map`         | `any`           | `null`  | Internal Leaflet map instance               |
| `markers`     | `Map<any, any>` |         | Map of markers keyed by username            |
| `users`       | `never[]`       | `[]`    | Array of user objects to display on the map |

## Methods

| Method           | Type                                                                                                      | Description                                                           |
| ---------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `clearMarkers`   | `(): void`                                                                                                | Removes all markers from the map                                      |
| `fitToMarkers`   | `(): void`                                                                                                | Adjusts the map bounds to include all markers                         |
| `focusLocation`  | `(lat: any, lng: any, username?: null, zoom?: number): void`                                              | Centers the map on specified coordinates and optionally opens a popup |
| `getCenter`      | `(): { lat: any; lng: any; } \| null`                                                                     | Returns current map center coordinates                                |
| `getZoom`        | `(): any`                                                                                                 | Returns current map zoom level                                        |
| `initializeMap`  | `(): Promise<void>`                                                                                       | Initializes the Leaflet map and adds base layer                       |
| `isReady`        | `(): any`                                                                                                 | Returns true if map is loaded and ready                               |
| `removeMarker`   | `(username: any): void`                                                                                   | Removes a marker by username                                          |
| `setCurrentUser` | `(username: any): void`                                                                                   | Sets the current user's username                                      |
| `upsertMarker`   | `(username: any, lat: any, lng: any, lastUpdated: any, isCurrentUser?: boolean, accuracy?: number): void` | Adds or updates a marker with optional accuracy circle                |

## Events

| Event          | Type                                                                          | Description                         |
| -------------- | ----------------------------------------------------------------------------- | ----------------------------------- |
| `map-click`    | `CustomEvent<{ lat: any; lng: any; }>`                                        | Fired when the map is clicked       |
| `map-ready`    | `CustomEvent<any>`                                                            | Fired when the map finishes loading |
| `marker-click` | `CustomEvent<{ username: any; lat: any; lng: any; isCurrentUser: boolean; }>` | Fired when a user marker is clicked |

## Usage Example

```html
<user-map
    .users="${users}"
    .currentUser="${currentUsername}"
    @map-click="${onMapClick}"
    @marker-click="${onMarkerClick}"
    @map-ready="${onMapReady}"
>
</user-map>
```

```js
function onMapClick(e) {
    console.log('Map clicked at:', e.detail.lat, e.detail.lng);
}

function onMarkerClick(e) {
    console.log('Marker clicked:', e.detail.username, e.detail.lat, e.detail.lng);
}

function onMapReady() {
    console.log('Map is ready');
}
```

## Behavior

- **Markers:**
  Each user in the `users` array is displayed as a marker. The current user has a distinct green marker with a pulsing effect.
  Clicking a marker emits `marker-click`.

- **Map Controls:**
  Standard Leaflet zoom and attribution controls are enabled.

- **Dynamic Updates:**
  The component automatically syncs markers when the `users` array changes.

- **Focus & Fit:**
  `focusLocation` centers the map on a specific user or coordinates.
  `fitToMarkers` adjusts the view to show all markers.

- **Loading State:**
  Shows a loading spinner overlay while the map initializes.
