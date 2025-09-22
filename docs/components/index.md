# Components Overview

PortLib’s frontend is built using a powerful and flexible technology called **native Web Components**. Think of them as custom, reusable HTML tags that work in any modern browser, with or without a framework like React or Vue.

This approach makes our components incredibly portable. You can integrate them into an existing project or use them to build something entirely new with minimal effort. This page provides a high-level overview of the core components available in our library.

## 📦 The Component Library

Each component is designed to handle a specific piece of functionality. Here are the foundational elements you'll use to build the PortLib experience.

### [`<app-view>`](/components/app-view)

The main wrapper for the entire application. It acts as the foundation, initializing the app's state and managing how the other child components are rendered and interact.

### [`<header-bar>`](/components/header-bar)

A clean and customizable header bar that sits at the top of the application. It's perfect for displaying your application's title, branding, or key navigation links.

### [`<login-view>`](/components/login-view)

This component handles the entire user authentication process. It provides the user interface for signing in and, upon a successful login, securely stores the **JWT (JSON Web Token)** to manage the user's session. It also emits events to let the rest of the app know the user's status.

### [`<user-list>`](/components/user-list)

A real-time sidebar component that automatically detects and displays a list of all users who are currently online and active on the platform.

### [`<user-map>`](/components/user-map)

The interactive heart of the application. This component renders a live map using the popular [Leaflet.js](https://leafletjs.com/) library. It visualizes real-time user locations using a peer-to-peer connection powered by [Yjs](https://docs.yjs.dev/) and **WebRTC**, making the social experience truly dynamic.

## 🧩 Building a Basic Layout

These components are designed to be composed together declaratively, just like standard HTML. Here is a simple example of how you can structure a minimal version of the application.

```html
<app-view>
    <header-bar title="Welcome to PortLib"></header-bar>
    <login-view></login-view>

    <user-map zoom="5"></user-map>
    <user-list></user-list>
</app-view>
```

## 🔗 Next Steps

Now that you have an overview, you're ready to explore how each component works in detail. We recommend reading the individual documentation pages for the components that interest you most.

Start with [`<app-view>`](/components/app-view) to understand the core application structure.

Explore [`<login-view>`](/components/login-view) and [`<user-map>`](/components/user-map) to see the main interactive features in action.

Or, jump directly to any component to learn about its specific properties and events.

Once you are comfortable with the frontend, see the [**API Docs**](/api/index) for details on how to connect to the backend.
