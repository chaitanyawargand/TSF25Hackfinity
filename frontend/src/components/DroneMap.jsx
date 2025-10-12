import React, { useState, useEffect, useRef } from "react";
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
import { useSelector } from "react-redux";

const DroneIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/826/826956.png",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

function DroneSimulator() {
  const map = useMap();
  const markerRef = useRef(null);
  const pathRef = useRef([]);
  const polylineRef = useRef(null);
  const lastTimeRef = useRef(0);
  const currentPos = useRef({ lat: 20.5937, lng: 78.9629 });
  const targetPos = useRef({ lat: 20.5937, lng: 78.9629 });
  const animationRef = useRef(null);

  useEffect(() => {
        const ws = new WebSocket("ws://localhost:3000");

    ws.onopen = () => {
      console.log("✅ Connected to WebSocket server");
      setSocket(ws);
    };

    const marker = L.marker([currentPos.current.lat, currentPos.current.lng], {
      icon: L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/2991/2991112.png",
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      }),
      rotationAngle: 0,
      rotationOrigin: "center",
    }).addTo(map);

    const polyline = L.polyline([[currentPos.current.lat, currentPos.current.lng]], {
      color: "red",
      weight: 3,
    }).addTo(map);
    markerRef.current = marker;
    polylineRef.current = polyline;
    pathRef.current = [[currentPos.current.lat, currentPos.current.lng]];
    const interval = setInterval(() => {
      const lat = targetPos.current.lat + (Math.random() - 0.5) * 0.3;
      const lng = targetPos.current.lng + (Math.random() - 0.5) * 0.3;
      targetPos.current = { lat, lng };
    }, 3000);
    const animate = (time) => {
      const dt = time - lastTimeRef.current;
      lastTimeRef.current = time;
      const speed = 0.001 * dt;
      currentPos.current.lat += (targetPos.current.lat - currentPos.current.lat) * speed;
      currentPos.current.lng += (targetPos.current.lng - currentPos.current.lng) * speed;
      // rotation angle
      const dx = targetPos.current.lng - currentPos.current.lng;
      const dy = targetPos.current.lat - currentPos.current.lat;
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

      // update drone
      marker.setLatLng([currentPos.current.lat, currentPos.current.lng]);
      marker.setRotationAngle(angle);

      // path
      pathRef.current.push([currentPos.current.lat, currentPos.current.lng]);
      polyline.setLatLngs(pathRef.current);

      // optional smooth follow
      map.panTo([currentPos.current.lat, currentPos.current.lng], { animate: true, duration: 0.3 });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationRef.current);
      clearInterval(interval);
      marker.remove();
      polyline.remove();
    };
  }, [map]);

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

function Map({ newMissionMode, drawType, selectedField, onFieldSaved,setMissionCreated }) {
  const [savedFields, setSavedFields] = useState([]);
  const [CurrentField, setCurrentField] = useState(null);
  const mapRef = useRef(null);
  const drawnFGRef = useRef(null);
  const previewLayerRef = useRef(null);
  const socketRef = useRef(null);

  // WebSocket setup
  useEffect(() => {
    const socket = new WebSocket("ws://localhost:3000");
    socketRef.current = socket;

    socket.onopen = () => console.log("🟢 Connected to WebSocket");

    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      console.log("📩 Received WS message:", msg);
    };

    socket.onerror = (err) => console.error("⚠️ WebSocket error:", err);

    socket.onclose = () => console.log("🔴 WebSocket closed");

    return () => {
      if (socketRef.current) socketRef.current.close();
    };
  }, []);

  const handleMapCreated = (mapInstance) => {
    mapRef.current = mapInstance;
  };

  const handleMissionCreated = async (mission) => {
    console.log("handleMissionCalled:", mission);

    if (mission.source === "new") {
      const payload = {
        id: "8ac5064f-1481-47d5-8746-d07cddf57e24", // ownerId
        coords: mission.coords,
      };
      console.log("Payload to backend:", payload);

      try {
        const response = await axios.post(
          "http://localhost:4000/newfield",
          payload,
          { headers: { "Content-Type": "application/json" } }
        );
        console.log("Field created:", response.data);
      } catch (error) {
        console.error("ERROR creating field:", error);
        throw error;
      }
    }

    // Send mission data via WebSocket
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({ command: "NEW_MISSION", data: mission })
      );
    }
  };

  const saveField = (fieldData, operation) => {
    if (!fieldData) return;
    const { coords, layer, type, source = "existing", uid } = fieldData;
    const finalUid = uid || Date.now();

    const fieldObj = { uid: finalUid, coords, operation, type, source };

    console.log("Saving field:", fieldObj);

    handleMissionCreated(fieldObj);

    setSavedFields((prev) => {
      const idx = prev.findIndex((f) => f.uid === finalUid);
      if (idx !== -1) {
        const arr = [...prev];
        arr[idx] = fieldObj;
        return arr;
      }
      return [...prev, fieldObj];
    });
    if (layer) {
      layer.setStyle({ color: source === "existing" ? "green" : "blue", dashArray: null });

      let latlng;
      try {
        latlng =
          type === "polygon"
            ? layer.getBounds().getCenter()
            : layer.getLatLngs()[Math.floor(layer.getLatLngs().length / 2)];
      } catch {
        latlng = null;
      }
      if (latlng) {
        layer.bindTooltip(operation, {
          permanent: true,
          direction: "center",
          className: "custom-field-label",
        }).openTooltip(latlng);
      }
      if (layer._popup) layer.closePopup();
    }

    previewLayerRef.current = null;
    setCurrentField(null);
    if (onFieldSaved) onFieldSaved(fieldObj);
  };
  const attachPopup = (layer, coords, type, meta = {}) => {
    const uid = meta.uid || layer._leaflet_id || Date.now();
    layer._uid = uid;
    layer.source = meta.source || "existing";

    const fieldData = {
      uid,
      coords,
      layer,
      type,
      source: layer.source,
    };
    const popupContent = L.DomUtil.create("div", "");
    const makeBtn = (label, color) => {
      const btn = L.DomUtil.create("button", "", popupContent);
      btn.innerText = label;
      btn.style.cssText = `margin:2px;padding:4px 8px;background:${color};color:white;border:none;border-radius:4px;cursor:pointer;`;
      btn.onclick = (ev) => {
        ev.stopPropagation?.();
        saveField(fieldData, label);
        setMissionCreated(true);
      };
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
    try {
      drawnFGRef.current && drawnFGRef.current.addLayer(layer);
    } catch {
      mapRef.current && layer.addTo(mapRef.current);
    }

    setTimeout(() => attachPopup(layer, coords, type, meta), 0);
    layer.on("click", () => {
      let currentCoords;
      try {
        currentCoords =
          type === "polygon"
            ? layer.getLatLngs()[0].map((p) => ({ lat: p.lat, lng: p.lng }))
            : layer.getLatLngs().map((p) => ({ lat: p.lat, lng: p.lng }));
      } catch {
        currentCoords = coords;
      }
      attachPopup(layer, currentCoords, type, meta);
    });

    return layer;
  };
  const onCreate = (e) => {
    const { layerType, layer } = e;
    if (!layer) return;
    let coords = [];
    if (layerType === "polygon") coords = layer.getLatLngs()[0].map((p) => ({ lat: p.lat, lng: p.lng }));
    else if (layerType === "polyline") coords = layer.getLatLngs().map((p) => ({ lat: p.lat, lng: p.lng }));
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
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="&copy; Esri"
        />
        <TileLayer
          url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
          attribution="&copy; Esri"
        />
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
        <DroneSimulator />
      </MapContainer>
    </div>
  );
}

export default Map;
