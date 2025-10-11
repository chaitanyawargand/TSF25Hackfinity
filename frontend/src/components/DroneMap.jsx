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

  // saveField receives full fieldData (not relying on React state timing)
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

    // style + tooltip
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

      // close popup if open
      if (layer._popup) layer.closePopup();
    }
    console.log("field object", fieldObj);
    previewLayerRef.current = null;
    setCurrentField(null);
    if (onFieldSaved) onFieldSaved(fieldObj);
  };

  // attach popup to a layer after it's added to map so layer._leaflet_id exists
  const attachPopup = (layer, coords, type, meta = {}) => {
    // create fieldData from the live layer and provided meta
    const uid = meta.uid || layer._leaflet_id || Date.now();
    // store metadata on layer for future reference (optional but handy)
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
      // Use direct call with fieldData to avoid React state timing issues
      btn.onclick = (ev) => {
        ev.stopPropagation?.(); // avoid map click bubbling
        saveField(fieldData, label);
      };
      return btn;
    };

    makeBtn("Scouting", "#3B82F6");
    makeBtn("Cropping", "#10B981");

    layer.bindPopup(popupContent).openPopup();
  };

  // create layer from coords; accepts optional meta (uid, source, fieldName)
  const createLayerFromCoords = (coords, opts = {}, type = "polygon", meta = {}) => {
    if (!coords || coords.length < 2) return null;
    const latlngs = coords.map((c) => [c.lat, c.lng]);
    const layer = type === "polygon" ? L.polygon(latlngs, opts) : L.polyline(latlngs, opts);

    // add to feature group or directly to map
    try {
      drawnFGRef.current && drawnFGRef.current.addLayer(layer);
    } catch {
      mapRef.current && layer.addTo(mapRef.current);
    }

    // ensure popup attaches after Leaflet assigned _leaflet_id
    // setTimeout 0 ensures the layer is fully initialized
    setTimeout(() => {
      attachPopup(layer, coords, type, meta);
    }, 0);

    // also attach click to re-open popup with fresh fieldData later
    layer.on("click", () => {
      // build fresh coords (in case layer was edited)
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

  // when user creates a new shape via draw control
  const onCreate = (e) => {
    const { layerType, layer } = e;
    if (!layer) return;
    let coords = [];
    if (layerType === "polygon") coords = layer.getLatLngs()[0].map((p) => ({ lat: p.lat, lng: p.lng }));
    else if (layerType === "polyline") coords = layer.getLatLngs().map((p) => ({ lat: p.lat, lng: p.lng }));
    createLayerFromCoords(coords, { color: "orange", weight: 2, dashArray: "6 6" }, layerType, { source: "new" });
  };

  // when remote/parent selects an existing field, create layer with its meta
  useEffect(() => {
    if (!selectedField) return;
    // remove any previous preview by uid if desired (optional)
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
