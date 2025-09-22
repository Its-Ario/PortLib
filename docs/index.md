# Welcome to PortLib

## Your Digital Bookshelf 📚

Welcome to the official documentation for **PortLib**! Imagine a shared, portable library that connects you with a community of book lovers right in your area. PortLib is a modern web application designed to make **buying, selling, and borrowing books** a seamless and social experience.

This documentation is your comprehensive guide. Whether you're looking to set up the project for the first time, dive into the API, or contribute to its development, you'll find everything you need right here.

## ✨ Core Features

PortLib is built with a modern, robust technology stack to provide a secure and real-time user experience. Here are some of the key features that power the platform:

- 🔐 **Secure User Authentication**: Utilizes **JSON Web Tokens (JWT)** for safe and stateless user sessions, ensuring that user data is always protected.
- 📚 **Comprehensive Book Management**: An intuitive system for users to list their books, which are then verified and managed within the platform's catalog.
- 💸 **Integrated Balance System**: A self-contained virtual wallet allows users to handle all payments, fees, and transactions directly within the app, no external payment processors required.
- 🗺️ **Live User Map**: See fellow users online in real-time! This feature is powered by a dynamic combination of [**Leaflet.js**](https://leafletjs.com/https://leafletjs.com/) for mapping and [**Yjs WebRTC**](https://yjs.dev/) for peer-to-peer data synchronization.
- 🧩 **Modern Frontend**: The entire user interface is built with **native Web Components**, ensuring our components are reusable, framework-agnostic, and highly performant. The frontend is bundled with **Vite** for a lightning-fast development experience.
- 📖 **Extensive API & Component Docs**: A fully documented backend built with **Express** and **MongoDB**, complemented by detailed documentation for every frontend component.

## 🚀 Quick Start Guide

Ready to get PortLib running on your local machine? This guide will walk you through the setup process in just a few minutes.

### Prerequisites

First, ensure you have the following software installed on your system:

- **Node.js**: Version 18 or higher.
- **MongoDB**: Version 6 or higher.
- **Docker**: Optional, recommended for a streamlined production deployment.

### Installation & Setup

1. **Clone the Repository**
   First, open your terminal, navigate to where you want to store the project, and clone the repository from GitHub.

    ```bash
    git clone [https://github.com/Its-Ario/PortLib.git](https://github.com/Its-Ario/PortLib.git)
    cd PortLib
    ```

2. **Install Dependencies**
   We use `pnpm` workspaces to manage the project's frontend and backend packages simultaneously. This command installs all dependencies for the entire project.

    ```bash
    pnpm -w install
    ```

3. **Launch the Development Servers**
   You will need to open **two separate terminal windows** or tabs to run the backend and frontend servers concurrently.

    In your first terminal, start the backend server:

    ```bash
    # This runs the Express API server
    pnpm -w run dev:backend
    ```

    In your second terminal, start the frontend development server:

    ```bash
    # This runs the Vite dev server with Hot-Module Replacement
    pnpm -w run dev:frontend
    ```

Once both servers are running, you can open your web browser and navigate to the local address provided by the frontend server (usually `http://localhost:5173`). You're all set!

## 📖 Explore the Documentation

This documentation is organized into two main sections. Dive in to learn how PortLib works under the hood.

- [**Component Library →**](/components/)
  A deep dive into our reusable frontend web components. Each page provides interactive examples, usage guidelines, and a list of available properties and events.

- [**API Reference →**](/api/)
  The complete reference for our backend REST API. Explore every available endpoint, see detailed request/response examples, and understand the data models.

## 🤝 Contributing to PortLib

PortLib is an open-source project, and we believe in the power of community collaboration. Whether you want to report a bug, suggest a new feature, or write code, your contributions are welcome!

Please visit our **[GitHub Repository](https://github.com/Its-Ario/PortLib)** to view open issues, submit pull requests, and join the development discussion.
