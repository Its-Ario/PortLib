# PortLib Documentation

Welcome to **PortLib** — a portable library SPA where users can **buy, sell, and borrow books** with a live social experience.  
This documentation will guide you through setting up, running, and extending PortLib.

## ✨ Features

- 🔐 **JWT Authentication** — secure login and token-based sessions.
- 📚 **Book Management** — submit, verify, and manage book listings.
- 💸 **Internal Balance System** — handle payments and fees without external services.
- 🗺️ **Live Map** — see online users in real-time using **Leaflet + Yjs WebRTC**.
- 🧩 **Reusable Web Components** — a frontend built with **native web components** and **Vite**.
- 📖 **API & Docs** — fully documented backend (Express + MongoDB) and frontend components.

## 🚀 Getting Started

### Requirements

- Node.js >= 18
- MongoDB >= 6
- Docker (optional, for production)

### Installation

Clone the repository:

```bash
git clone https://github.com/Its-Ario/PortLib.git
cd PortLib
```

Install dependencies:

```bash
pnpm -w install
```

Start development:

```bash
# backend
pnpm -w run dev:backend

# frontend
pnpm -w run dev:frontend
```

## 📖 Documentation Sections

- [Components](/components/) — reusable frontend web components.
- [API](/api/) — backend REST API reference.

## 🤝 Contributing

PortLib is open source! PRs and issues are welcome at:
[GitHub Repository](https://github.com/Its-Ario/PortLib)
