import React, { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  FeatureGroup,
  useMap,
} from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import { GeoSearchControl, OpenStreetMapProvider } from "leaflet-geosearch";
import "leaflet-geosearch/dist/geosearch.css";
import "./MapFixes.css";

// Location marker (uses useMap, so keep it as small component)
function LocationMarker() {
  const [position, setPosition] = useState(null);
  const map = useMap();

  useEffect(() => {
    map.locate({ setView: true, maxZoom: 16 });

    map.on("locationfound", (e) => {
      setPosition(e.latlng);
      map.flyTo(e.latlng, 16);
    });

    map.on("locationerror", () => {
      // keep simple alert for now
      // avoid spamming user — maybe you want custom UI later
      // alert("Location access denied. Please enable GPS or browser permission.");
    });
  }, [map]);

  return position ? (
    <Marker position={position}>
      <Popup>You are here</Popup>
    </Marker>
  ) : null;
}

// GeoSearch control
function SearchControl() {
  const map = useMap();

  useEffect(() => {
    const provider = new OpenStreetMapProvider();
    const searchControl = new GeoSearchControl({
      provider,
      style: "bar",
      showMarker: true,
      retainZoomLevel: false,
      autoClose: true,
    });

    map.addControl(searchControl);
    return () => map.removeControl(searchControl);
  }, [map]);

  return null;
}

function Map({
  newMissionMode,
  drawType,
  selectedField,
  onMissionCreated,
  onSelectedFieldHandled,
}) {
  const [newFieldData, setNewFieldData] = useState(null); // { layer, coords, source, fieldId?, fieldName? }
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [fields, setFields] = useState([]); // saved records
  const [dronePos, setDronePos] = useState(null);

  const mapRef = useRef(null);
  const mapReadyRef = useRef(false);
  const existingLayersRef = useRef([]); // track preview layers for existing fields

  // Called by MapContainer when created
  const handleMapCreated = (mapInstance) => {
    mapRef.current = mapInstance;
    mapReadyRef.current = true;
  };

  // Enable/disable map interactions while drawing (attach handlers once map ready)
  useEffect(() => {
    if (!mapReadyRef.current) return;
    const map = mapRef.current;
    const handleDrawStart = () => {
      map.dragging.disable();
      map.doubleClickZoom.disable();
    };
    const handleDrawStop = () => {
      map.dragging.enable();
      map.doubleClickZoom.enable();
    };

    map.on(L.Draw.Event.DRAWSTART, handleDrawStart);
    map.on(L.Draw.Event.DRAWSTOP, handleDrawStop);

    return () => {
      try {
        map.off(L.Draw.Event.DRAWSTART, handleDrawStart);
        map.off(L.Draw.Event.DRAWSTOP, handleDrawStop);
      } catch (err) {}
    };
  }, [mapReadyRef.current]);

  // When user draws using EditControl
  const onCreate = (e) => {
    const { layerType, layer } = e;
    if (layerType === "polygon") {
      const coords = layer.getLatLngs()[0].map((p) => ({ lat: p.lat, lng: p.lng }));
      console.log("Drawn polygon coords:", coords);
      setNewFieldData({ layer, coords, source: "drawn" });
      setShowFieldModal(true);
    } else if (layerType === "polyline") {
      const latlngs = layer.getLatLngs().map((p) => ({ lat: p.lat, lng: p.lng }));
      console.log("Drawn polyline coords:", latlngs);
      setNewFieldData({ layer, coords: latlngs, source: "drawn" });
      setShowFieldModal(true);
    } else if (layerType === "marker") {
      // handle marker if needed
      const latlng = layer.getLatLng();
      console.log("Marker created at:", latlng);
    }
  };

  // When parent passes an existing field, preview it and open the same modal
  useEffect(() => {
    if (!selectedField || !mapReadyRef.current) return;

    const map = mapRef.current;

    // remove previous preview layers
    existingLayersRef.current.forEach((l) => {
      try {
        map.removeLayer(l);
      } catch (err) {}
    });
    existingLayersRef.current = [];

    // build latlng array and create polygon preview
    const latlngs = selectedField.coords.map((c) => [c.lat, c.lng]);
    if (latlngs.length < 2) {
      console.warn("Selected field has insufficient coords:", selectedField);
      return;
    }

    const preview = L.polygon(latlngs, { color: "orange", weight: 2, dashArray: "6 6" }).addTo(map);
    existingLayersRef.current.push(preview);

    // fit to bounds so user sees polygon
    try {
      map.fitBounds(preview.getBounds().pad(0.12));
    } catch (err) {}

    // set as the newFieldData so save/cancel uses same modal
    setNewFieldData({
      layer: preview,
      coords: selectedField.coords,
      source: "existing",
      fieldId: selectedField.id,
      fieldName: selectedField.name,
    });

    // show modal shortly after drawing the preview so user can see it
    const t = setTimeout(() => setShowFieldModal(true), 300);

    return () => clearTimeout(t);
  }, [selectedField, mapReadyRef.current]);

  // Save action from modal (Scouting / Spraying)
  const saveField = (operation) => {
    if (!newFieldData) return;
    const { layer, coords, source, fieldId, fieldName } = newFieldData;
    const createdAt = Date.now();

    const mission = source === "existing"
      ? { fieldId, fieldName, operation, coords, createdAt, source: "existing" }
      : { id: createdAt, operation, coords, createdAt, source: "drawn" };

    // store locally
    setFields((prev) => [...prev, mission]);

    // bind popup and open
    try {
      layer.bindPopup(`<b>${operation}</b><br/>Saved`).openPopup();
    } catch (err) {
      console.warn("Could not bind popup to layer:", err);
    }

    console.log("Mission saved in Map:", mission);

    // notify parent
    if (onMissionCreated) onMissionCreated(mission);

    // cleanup
    setShowFieldModal(false);
    setNewFieldData(null);

    // if existing field preview, tell parent we handled it
    if (source === "existing" && onSelectedFieldHandled) onSelectedFieldHandled();
  };

  // Cancel the modal — remove preview or unsaved drawn layer
  const cancelFieldModal = () => {
    if (newFieldData?.layer) {
      try {
        newFieldData.layer.remove();
      } catch (err) {
        console.warn("Could not remove preview layer:", err);
      }
    }

    // clear preview tracking if any
    if (newFieldData?.source === "existing") {
      existingLayersRef.current = existingLayersRef.current.filter((l) => l !== newFieldData.layer);
      if (onSelectedFieldHandled) onSelectedFieldHandled();
    }

    setShowFieldModal(false);
    setNewFieldData(null);
  };

  const onDeleted = () => {
    setFields([]);
  };

  return (
    <div className="relative w-full h-screen">
      <MapContainer
        whenCreated={handleMapCreated}
        center={[20.5937, 78.9629]}
        zoom={5}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        {/* base layers */}
        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution='&copy; <a href="https://www.esri.com/">Esri</a>' />
        <TileLayer url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}" attribution='&copy; <a href="https://www.esri.com/">Esri</a>' />

        <LocationMarker />
        <SearchControl />

        <FeatureGroup>
          {newMissionMode && (
            <EditControl
              position="topright"
              onCreated={onCreate}
              onDeleted={onDeleted}
              draw={{
                rectangle: false,
                polygon: drawType === "polygon" || drawType === null,
                polyline: drawType === "polyline",
                circle: false,
                marker: true,
                circlemarker: false,
              }}
            />
          )}
        </FeatureGroup>

        {dronePos && (
          <Marker position={[dronePos.lat, dronePos.lng]}>
            <Popup>🚁 Drone in mission</Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Scouting / Spraying modal */}
      {showFieldModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
          onMouseDown={(e) => {
            // clicking backdrop closes modal (optional)
            if (e.target === e.currentTarget) cancelFieldModal();
          }}
        >
          <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center gap-6 w-96">
            <h2 className="text-xl font-semibold text-gray-800">Select Mission Type</h2>
            <div className="flex gap-4 w-full">
              <button onClick={() => saveField("Scouting")} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-bold transition-colors text-lg">
                Scouting
              </button>
              <button onClick={() => saveField("Spraying")} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 rounded-lg font-bold transition-colors text-lg">
                Spraying
              </button>
            </div>
            <button onClick={cancelFieldModal} className="mt-4 w-full bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 rounded-lg font-semibold transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Map;
