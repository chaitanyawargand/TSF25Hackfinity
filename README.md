# TSF25Hackfinity

> A full-stack multi-service system combining a React-based map UI, a Node.js backend with WebSocket, a FastAPI image-service, and a native simulator for mission/telemetry streaming.

## Table of Contents

- [Architecture Overview](#architecture-overview)  
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

