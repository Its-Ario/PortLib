<div align="center">
  <h1>PortLib 📖</h1>
  <strong>Your Digital Bookshelf</strong>
</div>

<br/>

<div align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License">
  <img src="https://img.shields.io/badge/status-active-brightgreen.svg" alt="Project Status">
  <img src="https://img.shields.io/github/issues/Its-Ario/PortLib" alt="GitHub issues">
  <img src="https://img.shields.io/github/stars/Its-Ario/PortLib" alt="GitHub stars">
</div>

## 👋 Introduction

**PortLib** is a modern web application that creates a shared, portable library for your local community. It connects book lovers, making it easy to **buy, sell, and borrow books** through a seamless and social platform.

<!-- This repository contains the full source code for the project. For a complete guide on the project's components and API, please visit our **[full documentation website](https://lib.itsario.ir/docs)**. -->

## ✨ Core Features

- 🔐 **Secure User Authentication**: Safe and stateless user sessions using **JSON Web Tokens (JWT)**.
- 📚 **Comprehensive Book Management**: An intuitive system for listing, verifying, and managing books.
- 💸 **Integrated Balance System**: A self-contained virtual wallet for in-app payments and transactions.
- 🗺️ **Live User Map**: Real-time user locations powered by [**Leaflet.js**](https://leafletjs.com/) and peer-to-peer data sync with [**Yjs**](https://docs.yjs.dev/) & **WebRTC**.
- 🧩 **Modern Frontend**: A reusable and framework-agnostic UI built with **native Web Components** and bundled with **Vite**.
- 📖 **Extensive API & Docs**: A fully documented backend (**Express** + **MongoDB**) and component library.

## 🛠️ Tech Stack

- **Frontend**: Native Web Components, [Vite](https://vitejs.dev/), [Leaflet.js](https://leafletjs.com/), [Yjs](https://docs.yjs.dev/)
- **Backend**: [Node.js](https://nodejs.org/), [Express.js](https://expressjs.com/), [Socket.IO](https://socket.io/) (for WebRTC signaling)
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/)
- **Authentication**: JSON Web Tokens (JWT)

## 🚀 Getting Started

Ready to get PortLib running on your local machine? This guide will walk you through the setup process.

### Prerequisites

- **Node.js**: v18 or higher
- **MongoDB**: v6 or higher
- **Docker**: Optional, for production deployment

### Installation & Setup

1. **Clone the Repository**

    ```bash
    git clone https://github.com/Its-Ario/PortLib.git
    cd PortLib
    ```

2. **Install Dependencies**
    This project uses `pnpm` workspaces to manage dependencies for the monorepo.

    ```bash
    pnpm -w install
    ```

3. **Launch the Development Servers**
    You will need **two separate terminals** to run the backend and frontend concurrently.

    *Terminal 1: Backend*

    ```bash
    # This runs the Express API server
    pnpm -w run dev:backend
    ```

    *Terminal 2: Frontend*

    ```bash
    # This runs the Vite dev server with Hot-Module Replacement
    pnpm -w run dev:frontend
    ```

Once both servers are running, open your browser to the address provided by Vite (usually `http://localhost:5173`).

## 🤝 Contributing

Contributions are welcome! PortLib is an open-source project, and we love to receive feedback, bug reports, and pull requests. Before you start, please read our (TODO: link to `CONTRIBUTING.md`) contribution guidelines.

Please visit the [GitHub Issues](https://github.com/Its-Ario/PortLib/issues) to see what you can help with.

## 📜 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
