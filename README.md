# TSF25Hackfinity

> A full-stack multi-service system combining a React-based map UI, a Node.js backend with WebSocket, a FastAPI image-service, and a native simulator for mission/telemetry streaming.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [File Structure](#file-structure) 
- [System Workflow](#system-workflow)  
- [Tech Stack & Components](#tech-stack--components)  
- [Prerequisites](#prerequisites)  
- [Setup & Running Locally](#setup--running-locally)  
  - [FastAPI Service](#fastapi-service)  
  - [Backend (Node.js)](#backend-nodejs)  
  - [Simulator (Native)](#simulator-native)  
  - [Frontend (React)](#frontend-react)  
- [Configuration & Environment Variables](#configuration--environment-variables)  
- [API & WebSocket Interface](#api--websocket-interface)  
- [Developer Workflows & Tips](#developer-workflows--tips)  
- [Troubleshooting](#troubleshooting)  
- [Contributing](#contributing)  
- [Authors & License](#authors--license)

---

## Architecture Overview

TSF25Hackfinity comprises four cooperating subsystems:

1. **Frontend (React SPA)**  
   - Displays a Leaflet map where users plan missions and view drone telemetry in real time.  
   - Connects through WebSocket for live updates, and via REST for mission submission and image uploads.

2. **Backend (Node.js + WebSocket)**  
   - Serves REST APIs for mission management and image forwarding.  
   - Hosts a WebSocket server to broadcast telemetry/status and receive control commands.  
   - Spawns or communicates with the simulator and relays between components.

3. **FastAPI Service (Python)**  
   - Receives image uploads, runs processing or inference, and returns results.  
   - Acts as a microservice that the backend calls.

4. **Simulator (Native/C++ or compiled executable)**  
   - Simulates drone motion based on mission waypoints.  
   - Emits telemetry over stdout or IPC, which backend captures and forwards.

This modular design isolates compute-heavy or native logic into separate services, making maintenance and scaling easier.

---

## File Structure
TSF25Hackfinity/
│
├── backend/                     # Node.js + Express backend
│   ├── Datatypes/               # Sequelize ORM models
│   │   ├── Field.js             # Field schema: stores field boundaries & metadata
│   │   ├── FlightLog.js         # Flight log schema: stores telemetry logs for missions
│   │   ├── Mission.js           # Mission schema: mission parameters (waypoints, speed, etc.)
│   │   ├── User.js              # User schema: stores authentication details
│   │   └── index.js             # Central Sequelize model registration
│   │
│   ├── auth/auth.js             # Google JWT / OAuth strategy for authentication
│   ├── db/db.js                 # Database connection setup (PostgreSQL / SQLite)
│   ├── routes/                  # Express route definitions
│   │   ├── authRoutes.js        # Handles Google login & JWT verification
│   │   ├── createNewField.js    # Route to create new field entries
│   │   ├── createNewFlightLog.js# Route to log telemetry data
│   │   ├── createNewMission.js  # Route to create new missions
│   │   └── getFields.js         # Fetch existing fields for a user
│   ├── server.js                # Main Express server entry point
│   ├── package.json
│   └── .gitignore
│
├── fastapi_service/             # FastAPI microservice for ML analysis
│   ├── app/
│   │   ├── __init__.py
│   │   ├── db.py                # SQLAlchemy DB setup
│   │   ├── field_crus.py        # CRUD operations for field data
│   │   ├── field_routes.py      # FastAPI route definitions
│   │   ├── main.py              # FastAPI application entry
│   │   ├── models.py            # Database models (Field, Telemetry)
│   │   └── schemas.py           # Pydantic schemas for validation
│   ├── .env                     # Environment variables
│   └── requirements.txt         # Python dependencies
│
├── frontend/                    # React-based user interface
│   ├── src/
│   │   ├── components/          # UI components
│   │   │   ├── DroneMap.jsx     # Leaflet map showing live drone position
│   │   │   ├── Mission.jsx      # Mission creation & telemetry visualization
│   │   │   ├── GoogleLogin.jsx  # Handles Google OAuth
│   │   │   ├── HomePage.jsx     # Landing page
│   │   │   ├── LoggedInHomePage.jsx # Post-login dashboard
│   │   │   ├── Success.jsx      # Confirmation after mission creation
│   │   │   └── sidebar.jsx      # Sidebar navigation
│   │   │
│   │   ├── features/            # Redux slices for user state
│   │   │   ├── Email.js
│   │   │   ├── Id.js
│   │   │   ├── Name.js
│   │   │   ├── Type.js
│   │   │   └── isLoggedIn.js
│   │   │
│   │   ├── redux/store-persist.js  # Redux store with persistence
│   │   ├── main.jsx               # React root entry
│   │   ├── index.css              # Global styles
│   │   └── TypeRouter.jsx         # Route-based rendering logic
│   ├── public/
│   │   └── vite.svg
│   ├── package.json
│   └── vite.config.js
│
├── simulator/                    # Drone simulation & telemetry generator
│   ├── server.js                 # WebSocket server (connects to React frontend)
│   ├── getImage.js               # Fetch random drone image from directory
│   ├── ImageGenerator.js         # Handles simulated drone image processing
│   ├── waypoints.js              # Defines sample waypoint coordinates
│   ├── batteryLevelSimulator.js  # Battery drain simulation
│   ├── grid.cpp / grid.exe       # C++ module for grid computation
│   ├── fastApi.py                # Python bridge to send data to FastAPI
│   ├── predict_plant_health.py   # ML model inference using MobileNetV2
│   ├── plant_disease_mobilenetv2_weights.pth # Trained model weights
│   ├── app/
│   │   ├── telemetry.py          # Python telemetry utilities
│   │   ├── test_ws.py            # WebSocket test client
│   │   ├── test.py
│   │   └── __init__.py
│   └── websocketConnection.js    # WebSocket client utilities
│
├── package.json                  # Root-level scripts & dependencies
└── package-lock.json


## System Workflow

1. User interacts with the frontend to draw mission waypoints on the map and submit a mission.
2. Frontend sends mission data to backend via REST.
3. Backend stores mission, launches the simulator with mission input, and monitors its output.
4. Simulator runs the mission, continuously emitting telemetry (position, speed, heading, battery) which the backend receives and parses.
5. The backend forwards telemetry updates via WebSocket to all connected frontend clients.
6. Frontend updates the map marker, telemetry panels, and mission progress in real time.
7. Images (if part of mission) can be uploaded from frontend → backend → forwarded to FastAPI service → processed and returned → displayed in frontend.

---

## Tech Stack & Components

| Component        | Language / Frameworks                          | Role |
|------------------|-----------------------------------------------|------|
| Frontend         | React, Leaflet, react-leaflet, axios, WebSockets | Map UI, mission creation, live telemetry |
| Backend          | Node.js, `ws`, Express (or equivalent), JWT, OAuth | REST + WebSocket server, orchestrator |
| FastAPI Service  | Python, FastAPI, uvicorn, (possibly PyTorch etc.) | Image processing / inference |
| Simulator        | C++ or native executable                       | Mission simulation & telemetry generation |

---

## Prerequisites

Make sure you have installed:

- Node.js (v16+ recommended) and npm / yarn  
- Python 3.8+ and pip / virtualenv  
- A C++ compiler / build tools for simulator (if building from source)  
- Git  

---

## Setup & Running Locally

Below are suggested steps. Adjust paths and commands to reflect your actual files.

### FastAPI Service

```bash
cd fastapi_service
python3 -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r requirements.txt   # or install fastapi, uvicorn, and any ML deps
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
### Backend (Node.js)

```bash
cd ../backend
npm install
# Create .env file (see Configuration section)
npm run dev   # or `node server.js` (or whatever the entrypoint is)
```

###Simulator (Native)
```bash
cd ../simulator
# Example build command
g++ -o simulator main.cpp
# Or follow your existing build scripts
```

### Frontend (React)
```bash
cd ../frontend
npm install
npm run dev
```

## ENV CONFIGURATION:

### Backend .env example

```bash
PORT=3000
WS_PORT=3000
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=…
GOOGLE_CLIENT_SECRET=…
FASTAPI_URL=http://localhost:8000
SIMULATOR_PATH=../simulator/simulator
```

## Contributing

- Fork the repository
- Create a feature branch: git checkout -b feat/your-feature
- Write your code, add tests, update docs
- Open a pull request with a description of changes
- Please follow consistent naming, code style, and update this README if you add or modify APIs.


