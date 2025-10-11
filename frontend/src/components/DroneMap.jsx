import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, FeatureGroup, useMap } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import { GeoSearchControl, OpenStreetMapProvider } from "leaflet-geosearch";
import "leaflet-geosearch/dist/geosearch.css";

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
      provider: provider,
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
function Map() {
  const [dronePos, setDronePos] = useState(null);
  const drawnItemsRef = useRef(null);
  const onCreate = (e) => {
    const { layerType, layer } = e;
    if (layerType === "polygon") {
      const name = prompt("Enter field name:");
      const coords = layer.getLatLngs()[0].map((p) => [p.lat, p.lng]);
      const newField = { id: Date.now(), name, coords };
      setFields((prev) => [...prev, newField]);
      console.log(newField);
      layer.bindPopup(`<b>${name}</b><br/>Saved field`);
      alert(`Field "${name}" saved successfully!`);
    }
  };
  const onDeleted = () => {
    setFields([]);
  };

  return (
    <div style={{ display: "flex" }}>      
      <div style={{ flex: 1 }}>
        <MapContainer
          center={[20.5937, 78.9629]}
          zoom={5}
          scrollWheelZoom={true}
          style={{ height: "100vh", width: "100%" }}
        >
          {/* Satellite Tiles */}
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
          <FeatureGroup ref={drawnItemsRef}>
            <EditControl
              position="topright"
              onCreated={onCreate}
              onDeleted={onDeleted}
              draw={{
                rectangle: false,
                polygon:true,
                polyline: true,
                circle: false,
                marker: true,
                circlemarker:false,
              }}
            />
          </FeatureGroup>
          {dronePos && (
            <Marker position={[dronePos.lat, dronePos.lng]}>
              <Popup>🚁 Drone in mission</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
}

export default Map;
