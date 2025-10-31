# TSF25Hackfinity

> A full-stack multi-service system combining a React-based map UI, a Node.js backend with WebSocket, a FastAPI image-service, and a native simulator for mission/telemetry streaming.
# DEMO VIDEO LINK - [Link](https://drive.google.com/file/d/1iE0eA50yYgoY5wzXjnRQY3DnlP6kEZHD/view?usp=sharing)
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
- [Machine Learning Models](#machine-learning-models) 
- [API & WebSocket Interface](#api--websocket-interface)  
- [Developer Workflows & Tips](#developer-workflows--tips)

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
```bash
TSF25Hackfinity/
│
├── backend/                     # Node.js + Express backend
│   ├── Datatypes/               # Sequelize ORM models
│   │   ├── Field.js             # Field schema: stores field boundaries & metadata
│   │   ├── FlightLog.js         # Flight log schema: telemetry logs
│   │   ├── Mission.js           # Mission schema: waypoints, speed, etc.
│   │   ├── User.js              # User schema: authentication details
│   │   └── index.js             # Model registration
│   │
│   ├── auth/auth.js             # Google JWT / OAuth strategy
│   ├── db/db.js                 # Database connection setup
│   ├── routes/                  # Express API routes
│   │   ├── authRoutes.js        # Handles Google login & JWT verification
│   │   ├── createNewField.js    # Create field entries
│   │   ├── createNewFlightLog.js# Log telemetry data
│   │   ├── createNewMission.js  # Create missions
│   │   └── getFields.js         # Fetch user fields
│   ├── server.js                # Express server entry point
│   └── package.json
│
├── fastapi_service/             # FastAPI ML microservice
│   ├── app/
│   │   ├── db.py                # SQLAlchemy DB setup
│   │   ├── field_crus.py        # CRUD ops for field data
│   │   ├── field_routes.py      # API routes
│   │   ├── main.py              # FastAPI entrypoint
│   │   ├── models.py            # DB models (Field, Telemetry)
│   │   └── schemas.py           # Pydantic models
│   ├── .env                     # Environment vars
│   └── requirements.txt         # Python dependencies
│
├── frontend/                    # React-based interface
│   ├── src/
│   │   ├── components/          # UI components
│   │   │   ├── DroneMap.jsx     # Leaflet live drone position map
│   │   │   ├── Mission.jsx      # Mission creation & visualization
│   │   │   ├── GoogleLogin.jsx  # Google OAuth
│   │   │   ├── HomePage.jsx     # Landing page
│   │   │   ├── LoggedInHomePage.jsx # Dashboard
│   │   │   ├── Success.jsx      # Mission success screen
│   │   │   └── Sidebar.jsx      # Navigation sidebar
│   │   ├── features/            # Redux state management
│   │   │   ├── Email.js
│   │   │   ├── Id.js
│   │   │   ├── Name.js
│   │   │   ├── Type.js
│   │   │   └── isLoggedIn.js
│   │   ├── redux/store-persist.js # Redux store with persistence
│   │   ├── main.jsx               # React root
│   │   ├── index.css              # Styles
│   │   └── TypeRouter.jsx         # Conditional routing
│   ├── public/
│   │   └── vite.svg
│   ├── package.json
│   └── vite.config.js
│
├── simulator/                   # Drone simulation and telemetry
│   ├── server.js                # WebSocket server for telemetry
│   ├── getImage.js              # Pick random image
│   ├── ImageGenerator.js        # Simulated drone image handler
│   ├── waypoints.js             # Sample coordinates
│   ├── batteryLevelSimulator.js # Battery drain logic
│   ├── grid.cpp / grid.exe      # C++ path computation
│   ├── fastApi.py               # Sends data to FastAPI service
│   ├── predict_plant_health.py  # ML model inference (MobileNetV2)
│   ├── plant_disease_mobilenetv2_weights.pth # Trained weights
│   ├── app/
│   │   ├── telemetry.py          # Python telemetry utils
│   │   ├── test_ws.py            # WebSocket test client
│   │   └── test.py
│   └── websocketConnection.js   # Client-side WebSocket handler
│
├── package.json                 # Root-level scripts
└── package-lock.json
```

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

### Backend (Node.js)

```bash
cd ../backend
npm install
# Create .env file (see Configuration section)
nodemon server.js
```

### Simulator + Fast API
```bash
cd simulator
pip install -r requirements.txt   # or install fastapi, uvicorn, and any ML deps
python3 -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate
uvicorn fastapi --reload --host 0.0.0.0 --port 8000
nodemon server.js
g++ -o simulator grid.cpp
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

## Machine Learning Models

The **FastAPI microservice** integrates two machine learning pipelines designed for agricultural analysis and live field monitoring.

### 1. Weed Segmentation (UNet with ResNet50 Encoder)

- **Model**: UNet architecture with ResNet50 encoder  
- **Task**: Segments weed coverage from aerial images captured by drones  
- **Input**: Raw image bytes (transmitted through API endpoints)  
- **Output**: Image bytes containing an overlay showing detected weed regions  
- **Deployment**: Inference is served through the FastAPI service, producing real-time visual overlays for the frontend map view  
- **Weights**: Stored as a GitHub release asset due to file size (>100 MB)
- <img width="326" height="85" alt="image" src="https://github.com/user-attachments/assets/89938f8d-b063-4ed5-94fb-64d5255942ac" />


### 2. Crop Disease Classification (MobileNetV2)

- **Model**: MobileNetV2  
- **Task**: Classifies crop health as *healthy* or *diseased* based on field images  
- **Input**: Raw image bytes received from drone or simulator  
- **Output**: JSON response with health status prediction  
- **Deployment**: Integrated within the FastAPI service for low-latency classification  
- **Weights**: Stored locally in the FastAPI directory (`plant_disease_mobilenetv2_weights.pth`)
<img width="680" height="622" alt="image" src="https://github.com/user-attachments/assets/1060f03d-892e-43aa-ae75-c7945640b987" />




Both models are fully modular and accessible through REST endpoints exposed by the FastAPI service, enabling seamless integration with the Node.js backend and React frontend for real-time field analysis and monitoring.


## Contributing

- Fork the repository
- Create a feature branch: git checkout -b feat/your-feature
- Write your code, add tests, update docs
- Open a pull request with a description of changes
- Please follow consistent naming, code style, and update this README if you add or modify APIs.

Made With <3 by Rishab, Chaitany, Rutuj, Yashwant and Niharika
