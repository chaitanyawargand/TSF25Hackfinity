import React, { useState, useEffect, useRef } from "react";
import drone from "../drone.png";
import {
  MapContainer,
  TileLayer,
  Marker,
  FeatureGroup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet-rotatedmarker";
import { EditControl } from "react-leaflet-draw";
import axios from "axios";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";

const DroneIcon = L.icon({
  iconUrl: drone,
  iconSize: [70,70],
  iconAnchor: [20, 20],
});

function DroneSimulator({ targetPos, initialPos }) {
  const map = useMap();
  const markerRef = useRef(null);
  const polylineRef = useRef(null);
  const pathRef = useRef([]);
  const animationRef = useRef(null);
  const currentPos = useRef(initialPos); // Start at initial position
  const lastTimeRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    // Create drone marker
    const marker = L.marker([currentPos.current.lat, currentPos.current.lng], {
      icon: DroneIcon,
      rotationAngle: 0,
      rotationOrigin: "center",
    }).addTo(map);

    // Create drone path polyline
    const polyline = L.polyline([[currentPos.current.lat, currentPos.current.lng]], {
      weight: 1,
      color:'transparent'
    }).addTo(map);

    markerRef.current = marker;
    polylineRef.current = polyline;
    pathRef.current = [[currentPos.current.lat, currentPos.current.lng]];

    const animate = (time) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dt = time - lastTimeRef.current;
      lastTimeRef.current = time;

      const target = targetPos.current;
      if (target) {
        // Convert WebSocket lat/lng by dividing by 120
        const targetLat = target.lat;
        const targetLng = target.lng;

        const dx = targetLng - currentPos.current.lng;
        const dy = targetLat - currentPos.current.lat;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0.00001) {
          // speed proportional to distance
          const speed = Math.min(0.01 * dt, 1); 
          currentPos.current.lat += dy * speed;
          currentPos.current.lng += dx * speed;

          const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
          marker.setLatLng([currentPos.current.lat, currentPos.current.lng]);
          marker.setRotationAngle(angle);

          pathRef.current.push([currentPos.current.lat, currentPos.current.lng]);
          polyline.setLatLngs(pathRef.current);

          // Pan map smoothly
          map.panTo([currentPos.current.lat, currentPos.current.lng], { animate: true, duration: 0.3 });
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationRef.current);
      marker.remove();
      polyline.remove();
    };
  }, [map, targetPos, initialPos]);

  return null;
}


function LocationMarker() {
  const [position, setPosition] = useState(null);
  const map = useMap();

  useEffect(() => {
    map.locate({ setView: true, maxZoom: 16 });
    map.on("locationfound", (e) => setPosition(e.latlng));
  }, [map]);

  return position ? <Marker position={position} /> : null;
}

function Map({ newMissionMode, drawType, selectedField, onFieldSaved, setMissionCreated, missionCreated }) {
  const [savedFields, setSavedFields] = useState([]);
  const [missionStarted, setMissionStarted] = useState(false);
  const mapRef = useRef(null);
  const drawnFGRef = useRef(null);
  const previewLayerRef = useRef(null);
  const socketRef = useRef(null);

  const targetPos = useRef({});
  const initialDronePos = useRef({ lat: 0, lng: 0 });

  // WebSocket
  useEffect(() => {
    const socket = new WebSocket("ws://localhost:3000");
    socketRef.current = socket;

    socket.onopen = () => console.log("🟢 Connected to WebSocket");

    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg?.telemetry && missionStarted) {
        const { lat, lng } = msg.telemetry;
        targetPos.current = { lat, lng }; // in minutes
      }
    };

    socket.onerror = (err) => console.error("⚠️ WebSocket error:", err);
    socket.onclose = () => console.log("🔴 WebSocket closed");

    return () => socketRef.current?.close();
  }, [missionStarted]);

  const handleMapCreated = (mapInstance) => { mapRef.current = mapInstance; };

  const handleMissionCreated = async (mission) => {
    if (mission.source === "new") {
      const payload = { id: "8ac5064f-1481-47d5-8746-d07cddf57e24", coords: mission.coords,missionid:Date.now()};
      try { await axios.post("http://localhost:4000/newfield", payload, { headers: { "Content-Type": "application/json" } }); } 
      catch (error) { console.error("ERROR creating field:", error); throw error; }
    }

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ command: "NEW_MISSION", data: mission }));
    }

    // Start drone at first coordinate
    if (mission.coords && mission.coords.length > 0) {
      const firstCoord = mission.coords[0];
      initialDronePos.current = { lat: firstCoord.lat, lng: firstCoord.lng };
      targetPos.current = { lat: firstCoord.lat, lng: firstCoord.lng };
      setMissionStarted(true);
    }
  };

  const saveField = (fieldData, operation) => {
    if (!fieldData) return;
    const { coords, layer, type, source = "existing", uid } = fieldData;
    const finalUid = uid || Date.now();
    const fieldObj = { uid: finalUid, coords, operation, type, source };

    handleMissionCreated(fieldObj);

    setSavedFields((prev) => {
      const idx = prev.findIndex((f) => f.uid === finalUid);
      if (idx !== -1) { const arr = [...prev]; arr[idx] = fieldObj; return arr; }
      return [...prev, fieldObj];
    });

    if (layer) {
      layer.setStyle({ color: source === "existing" ? "green" : "blue", dashArray: null });
      let latlng;
      try { latlng = type === "polygon" ? layer.getBounds().getCenter() : layer.getLatLngs()[Math.floor(layer.getLatLngs().length / 2)]; } 
      catch { latlng = null; }
      if (latlng) { layer.bindTooltip(operation, { permanent: true, direction: "center", className: "custom-field-label" }).openTooltip(latlng); }
      if (layer._popup) layer.closePopup();
    }
    console.log(fieldObj);
    setMissionCreated(true);
    previewLayerRef.current = null;
    if (onFieldSaved) onFieldSaved(fieldObj);
  };

  const attachPopup = (layer, coords, type, meta = {}) => {
    const uid = meta.uid || layer._leaflet_id || Date.now();
    layer._uid = uid;
    layer.source = meta.source || "existing";

    const fieldData = { uid, coords, layer, type, source: layer.source };
    const popupContent = L.DomUtil.create("div", "");

    const makeBtn = (label, color) => {
      const btn = L.DomUtil.create("button", "", popupContent);
      btn.innerText = label;
      btn.style.cssText = `margin:2px;padding:4px 8px;background:${color};color:white;border:none;border-radius:4px;cursor:pointer;`;
      btn.onclick = (ev) => { ev.stopPropagation?.(); saveField(fieldData, label); };
      return btn;
    };

    makeBtn("Scouting", "#3B82F6");
    makeBtn("Cropping", "#10B981");

    layer.bindPopup(popupContent).openPopup();
  };

  const createLayerFromCoords = (coords, opts = {}, type = "polygon", meta = {}) => {
    if (!coords || coords.length < 2) return null;
    const latlngs = coords.map((c) => [c.lat, c.lng]);
    const layer = type === "polygon" ? L.polygon(latlngs, opts) : L.polyline(latlngs, opts);
    drawnFGRef.current?.addLayer(layer);
    setTimeout(() => attachPopup(layer, coords, type, meta), 0);

    layer.on("click", () => {
      let currentCoords;
      try { currentCoords = type === "polygon" ? layer.getLatLngs()[0].map((p) => ({ lat: p.lat, lng: p.lng })) : layer.getLatLngs().map((p) => ({ lat: p.lat, lng: p.lng })); } 
      catch { currentCoords = coords; }
      attachPopup(layer, currentCoords, type, meta);
    });

    return layer;
  };

  const onCreate = (e) => {
    const { layerType, layer } = e;
    if (!layer) return;
    let coords = layerType === "polygon" ? layer.getLatLngs()[0].map((p) => ({ lat: p.lat, lng: p.lng })) : layer.getLatLngs().map((p) => ({ lat: p.lat, lng: p.lng }));
    createLayerFromCoords(coords, { color: "orange", weight: 2, dashArray: "6 6" }, layerType, { source: "new" });
  };

  const onDeleted = (e) => {
    const removed = [];
    e.layers.eachLayer((layer) => removed.push(layer._leaflet_id || layer._uid));
    if (removed.length) setSavedFields((prev) => prev.filter((f) => !removed.includes(f.uid)));
  };

  useEffect(() => {
    if (!selectedField) return;
    const meta = { uid: selectedField.uid, source: selectedField.source, fieldName: selectedField.fieldName };
    createLayerFromCoords(selectedField.coords, { color: "orange", weight: 2, dashArray: "6 6" }, selectedField.type || "polygon", meta);
  }, [selectedField]);

  return (
    <div className="relative w-full h-screen">
      <style>{`
        .custom-field-label {
          background-color: white;
          color: black;
          font-weight: 600;
          font-size: 12px;
          padding: 2px 6px;
          border-radius: 4px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
          pointer-events: none;
        }
      `}</style>

      <MapContainer whenCreated={handleMapCreated} center={[20.5937, 78.9629]} zoom={5} className="h-full w-full">
        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="&copy; Esri" />
        <TileLayer url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}" attribution="&copy; Esri" />
        <LocationMarker />
        <FeatureGroup ref={drawnFGRef}>
          <EditControl
            position="topright"
            onCreated={onCreate}
            onDeleted={onDeleted}
            draw={{
              rectangle: false,
              polygon: newMissionMode && (drawType === "polygon" || drawType === null),
              polyline: newMissionMode && drawType === "polyline",
              circle: false,
              marker: false,
            }}
          />
        </FeatureGroup>

        {missionStarted && <DroneSimulator targetPos={targetPos} initialPos={initialDronePos.current} missionStarted={missionStarted} />}
      </MapContainer>
    </div>
  );
}

export default Map;
