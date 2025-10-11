import React, { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  FeatureGroup,
  useMap,
} from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";

function LocationMarker() {
  const [position, setPosition] = useState(null);
  const map = useMap();
  useEffect(() => {
    map.locate({ setView: true, maxZoom: 16 });
    map.on("locationfound", (e) => setPosition(e.latlng));
  }, [map]);
  return position ? <Marker position={position} /> : null;
}

function Map({ newMissionMode, drawType, selectedField, onFieldSaved }) {
  const [savedFields, setSavedFields] = useState([]);
  const mapRef = useRef(null);
  const drawnFGRef = useRef(null);

  const handleMapCreated = (mapInstance) => {
    mapRef.current = mapInstance;
  };
  const saveField = (fieldData, operation) => {
    if (!fieldData) return;
    const { coords, layer, type, source = "existing", fieldName = "", uid } = fieldData;
    const finalUid = uid || Date.now();
    const fieldObj = { uid: finalUid, coords, operation, type, source, fieldName };

    console.log("Saving field:", fieldObj);

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
        if (type === "polygon") latlng = layer.getBounds().getCenter();
        else {
          const latlngs = layer.getLatLngs();
          latlng = Array.isArray(latlngs) ? latlngs[Math.floor(latlngs.length / 2)] : layer.getLatLng();
        }
      } catch (err) {
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

    if (onFieldSaved) onFieldSaved(fieldObj);
  };
  const attachPopup = (layer, coords, type, meta = {}) => {
    const uid = meta.uid || layer._leaflet_id || Date.now();
    layer._uid = uid;
    layer.source = meta.source || layer.source || "existing";
    layer.fieldName = meta.fieldName || layer.fieldName || "";

    const fieldData = {
      uid,
      coords,
      layer,
      type,
      source: layer.source,
      fieldName: layer.fieldName,
    };
    const popupContent = L.DomUtil.create("div", "");
    const makeBtn = (label, color) => {
      const btn = L.DomUtil.create("button", "", popupContent);
      btn.innerText = label;
      btn.style.cssText = `margin:2px;padding:4px 8px;background:${color};color:white;border:none;border-radius:4px;cursor:pointer;`;
      btn.onclick = (ev) => {
        ev.stopPropagation?.(); 
        saveField(fieldData, label);
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
    setTimeout(() => {
      attachPopup(layer, coords, type, meta);
    }, 0);
    layer.on("click", () => {
      let currentCoords;
      try {
        if (type === "polygon") currentCoords = layer.getLatLngs()[0].map(p => ({ lat: p.lat, lng: p.lng }));
        else currentCoords = layer.getLatLngs().map(p => ({ lat: p.lat, lng: p.lng }));
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
  useEffect(() => {
    if (!selectedField) return;
    const meta = { uid: selectedField.uid, source: selectedField.source, fieldName: selectedField.fieldName };
    createLayerFromCoords(selectedField.coords, { color: "orange", weight: 2, dashArray: "6 6" }, selectedField.type || "polygon", meta);
  }, [selectedField]);

  const onDeleted = (e) => {
    const removed = [];
    e.layers.eachLayer((layer) => {
      if (layer._leaflet_id) removed.push(layer._leaflet_id);
      else if (layer._uid) removed.push(layer._uid);
    });
    if (removed.length) {
      setSavedFields((prev) => prev.filter((f) => !removed.includes(f.uid)));
    }
  };

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
      </MapContainer>
    </div>
  );
}

export default Map;
