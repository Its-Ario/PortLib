# Components Overview

PortLib’s frontend is built with **native Web Components**.  
These components are framework-agnostic and can be reused in any project.

## 📦 Available Components

### [`<app-view>`](/components/app-view)

Global root container that initializes the app and renders child components.

### [`<header-bar>`](/components/header-bar)

A header bar displayed above the live map, useful for branding or navigation.

### [`<login-view>`](/components/login-view)

Authentication view that manages login flow and JWT storage. Emits login events.

### [`<user-list>`](/components/user-list)

Displays the list of currently online users in real time.

### [`<user-map>`](/components/user-map)

Interactive map powered by **Leaflet** and **Yjs WebRTC** showing live user locations.

## 🧩 Usage Example

A minimal app layout using the core components:

```html
<app-view>
    <header-bar title="PortLib"></header-bar>
    <login-view></login-view>
    <user-map zoom="5"></user-map>
    <user-list></user-list>
</app-view>
```

## 🔗 Next Steps

- Explore individual component docs:
  - [`<app-view>`](/components/app-view)
  - [`<header-bar>`](/components/header-bar)
  - [`<login-view>`](/components/login-view)
  - [`<user-list>`](/components/user-list)
  - [`<user-map>`](/components/user-map)

- See the [API Docs](/api/) for backend integration details.
