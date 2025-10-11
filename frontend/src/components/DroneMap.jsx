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
      alert("Location access denied. Please enable GPS or browser permission.");
    });
  }, [map]);

  return position ? (
    <Marker position={position}>
      <Popup>You are here</Popup>
    </Marker>
  ) : null;
}
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
function Map({ newMissionMode, drawType }) {
  const [newFieldData, setNewFieldData] = useState(null); 
  const [showFieldModal, setShowFieldModal] = useState(false); 
  const [fields, setFields] = useState([]);
  const [dronePos, setDronePos] = useState(null);
  const drawnItemsRef = useRef(null);
  useEffect(() => {
    const map = drawnItemsRef.current?.leafletElement?._map;
    if (!map) return;

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
      map.off(L.Draw.Event.DRAWSTART, handleDrawStart);
      map.off(L.Draw.Event.DRAWSTOP, handleDrawStop);
    };
  }, []);

  const onCreate = (e) => {
    const { layerType, layer } = e;
    if (layerType === "polygon") {
      const coords = layer.getLatLngs()[0].map(p => ({ lat: p.lat, lng: p.lng }));
      setNewFieldData({ layer, coords });
      setShowFieldModal(true); 
    }
  };
  const saveField = (type) => {
    if (!newFieldData) return;
    const { layer, coords } = newFieldData;

    const newField = { CreatedAt: Date.now(), type, coords };
    setFields(prev => [...prev, newField]);

    layer.bindPopup(`<b>${type}</b><br/>Saved field`).openPopup();
    console.log("Field Saved:", {
      CreatedAt,
      type: newField.type,
      coords: newField.coords
    });

    setShowFieldModal(false);
    setNewFieldData(null);
  };
  const onDeleted = () => setFields([]);
  return (
    <div className="relative w-full h-screen">
      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        {/* 🗺️ Base layers */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
        />
        <TileLayer
          url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
        />
        <LocationMarker />
        <SearchControl />
        {newMissionMode && (
          <FeatureGroup ref={drawnItemsRef}>
            <EditControl
              position="topright"
              onCreated={onCreate}
              draw={{
                rectangle: false,
                polygon: drawType === "polygon",
                polyline: drawType === "polyline",
                circle: false,
                marker: true,
                circlemarker: false,
              }}
            />
          </FeatureGroup>
        )}
        {dronePos && (
          <Marker position={[dronePos.lat, dronePos.lng]}>
            <Popup>🚁 Drone in mission</Popup>
          </Marker>
        )}
      </MapContainer>
      {showFieldModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
          <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center gap-6 w-96">
            <h2 className="text-xl font-semibold text-gray-800">
              Select Field Type
            </h2>
            <div className="flex gap-4 w-full">
              <button
                onClick={() => saveField("Scouting")}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-bold transition-colors text-lg"
              >
                Scouting
              </button>
              <button
                onClick={() => saveField("Cropping")}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 rounded-lg font-bold transition-colors text-lg"
              >
               spraying
              </button>
            </div>
            <button
              onClick={() => setShowFieldModal(false)}
              className="mt-4 w-full bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Map;
