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
    map.on("locationfound", (e) => {
      setPosition(e.latlng);
    });
  }, [map]);
  return position ? <Marker position={position} /> : null;
}
function Map({ newMissionMode, drawType, selectedField, onFieldSaved }) {
  const [savedFields, setSavedFields] = useState([]);
  const [currentField, setCurrentField] = useState(null);
  const mapRef = useRef(null);
  const drawnFGRef = useRef(null);
  const previewLayerRef = useRef(null);
  const handleMapCreated = (mapInstance) => {
    mapRef.current = mapInstance;
  };
  const saveField = (operation) => {
    if (!currentField) return;
    const { coords, layer, type, source, fieldName } = currentField;
    const uid = Date.now();
    const fieldObj = { uid, coords, operation, type, source, fieldName };
    setSavedFields((prev) => [...prev, fieldObj]);
    if (layer) {
      layer.setStyle({ color: source === "existing" ? "green" : "blue", dashArray: null });
      let latlng;
      if (type === "polygon") {
        latlng = layer.getBounds().getCenter();
      } else if (type === "polyline") {
        const latlngs = layer.getLatLngs();
        const midIndex = Math.floor(latlngs.length / 2);
        latlng = latlngs[midIndex];
      }
      if (latlng) {
        layer.bindTooltip(operation, {
          permanent: true,
          direction: "center",
          className: "custom-field-label",
        }).openTooltip(latlng);
      }
      layer.closePopup();
    }
    console.log("field object", fieldObj);
    previewLayerRef.current = null;
    setCurrentField(null);
    if (onFieldSaved) onFieldSaved(fieldObj);
  };
  const createLayerFromCoords = (coords, opts = {}, type = "polygon") => {
    if (!coords || coords.length < 2) return null;
    let layer = null;
    if (type === "polygon") {
      const latlngs = coords.map((c) => [c.lat, c.lng]);
      layer = L.polygon(latlngs, opts);
    } else if (type === "polyline") {
      const latlngs = coords.map((c) => [c.lat, c.lng]);
      layer = L.polyline(latlngs, opts);
    }
   const attachPopup = () => {
  setCurrentField({ coords, layer, type, source: layer.source, fieldName: layer.fieldName });
  const popupContent = L.DomUtil.create("div", "");
  const scoutingBtn = L.DomUtil.create("button", "", popupContent);
  scoutingBtn.innerText = "Scouting";
  scoutingBtn.style.cssText =
    "margin:2px;padding:4px 8px;background:#3B82F6;color:white;border-radius:4px;border:none;cursor:pointer;";
  scoutingBtn.onclick = () => {
    saveField("Scouting");
    layer.closePopup(); 
  };
  const croppingBtn = L.DomUtil.create("button", "", popupContent);
  croppingBtn.innerText = "Cropping";
  croppingBtn.style.cssText =
    "margin:2px;padding:4px 8px;background:#10B981;color:white;border-radius:4px;border:none;cursor:pointer;";
  croppingBtn.onclick = () => {
    saveField("Cropping");
    layer.closePopup();
  };
  layer.bindPopup(popupContent).openPopup();
};
layer.on("click", attachPopup);
try {
  drawnFGRef.current.addLayer(layer);
} catch {
  layer.addTo(mapRef.current);
}
setTimeout(attachPopup, 200);
return layer;
  }
  const onCreate = (e) => {
    const { layerType, layer } = e;
    if (!layer) return;
    let coords = [];
    if (layerType === "polygon") {
      coords = layer.getLatLngs()[0].map((p) => ({ lat: p.lat, lng: p.lng }));
    } else if (layerType === "polyline") {
      coords = layer.getLatLngs().map((p) => ({ lat: p.lat, lng: p.lng }));
    } else return;
    if (previewLayerRef.current) previewLayerRef.current.remove();
    const preview = createLayerFromCoords(
      coords,
      { color: "orange", weight: 2, dashArray: "6 6" },
      layerType
    );
    previewLayerRef.current = preview;
  };
  useEffect(() => {
    if (!selectedField) return;
    if (previewLayerRef.current) previewLayerRef.current.remove();
    const preview = createLayerFromCoords(
      selectedField.coords,
      { color: "orange", weight: 2, dashArray: "6 6" },
      selectedField.type || "polygon"
    );
    previewLayerRef.current = preview;
  }, [selectedField]);
  const onDeleted = (e) => {
    const removed = [];
    e.layers.eachLayer((layer) => {
      if (layer._leaflet_id) removed.push(layer._leaflet_id);
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
      <MapContainer
        whenCreated={handleMapCreated}
        center={[20.5937, 78.9629]}
        zoom={5}
        className="h-full w-full"
      >
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
