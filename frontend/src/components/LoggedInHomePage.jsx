import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toggler } from "../features/isLoggedIn";
import { Menu, X, LogOut } from "lucide-react";
import Map from "./DroneMap";

const LoggedInHomePage = () => {
  const [newMissionMode, setNewMissionMode] = useState(false);
  const [drawType, setDrawType] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [showMissionPopup, setShowMissionPopup] = useState(false); 
  const [showExistingPopup, setShowExistingPopup] = useState(false); 
  const [showDrawTypePopup, setShowDrawTypePopup] = useState(false); 

  const [selectedField, setSelectedField] = useState(null);
  const [missions, setMissions] = useState([]);

  const dispatch = useDispatch();
  const userName = useSelector((state) => state.Name?.value);

  const existingFields = [
    { id: 4,
  name: "Field A",
  coords: [
    { lat: 10.768409206798315, lng: 78.80729198455812 },
    { lat: 10.766512533928713, lng: 78.80686283111574 },
    { lat: 10.765627415836944, lng: 78.81171226501466 },
    { lat: 10.768324910479876, lng: 78.81149768829347 },
    { lat: 10.769673648744236, lng: 78.80815029144289 }
  ], },
    { id: 2, name: "Field B", coords: [{ lat: 20.598, lng: 78.965 }, { lat: 20.599, lng: 78.966 }, { lat: 20.601, lng: 78.964 }] },
  ];

  const handleLogout = () => dispatch(toggler());

  const startNewMission = () => setShowMissionPopup(true);

  const chooseExistingField = () => {
    setShowMissionPopup(false);
    setShowExistingPopup(true);
  };

  const handleSelectExistingField = (field) => {
    setShowExistingPopup(false);
    setSelectedField({ ...field, _selectedAt: Date.now() });
    setNewMissionMode(false);
    setDrawType(null);
  };

  const chooseNewField = () => {
    setShowMissionPopup(false);
    setShowDrawTypePopup(true);
  };

  const selectDrawType = (type) => {
    setDrawType(type);
    setNewMissionMode(true);
    setShowDrawTypePopup(false);
    setSelectedField(null);
  };

  const handleFieldSaved = (fieldObj) => {
    setMissions((prev) => [...prev, fieldObj]);
    console.log("Saved Field:", fieldObj);
    // Reset drawing mode after saving
    setNewMissionMode(false);
    setDrawType(null);
    setSelectedField(null);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} w-64 z-50`}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Menu</h2>
          <button onClick={() => setSidebarOpen(false)}><X size={24} /></button>
        </div>
        <nav className="p-4 space-y-3">
          <a href="#" className="block text-gray-700 hover:text-blue-600">View Previous Missions</a>
        </nav>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        <header className="flex justify-between items-center bg-white shadow px-6 py-3 z-40">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-700 hover:text-gray-900"><Menu size={28} /></button>
          <h1 className="text-lg font-semibold text-gray-800">Dashboard</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={startNewMission}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg font-medium transition-colors"
            >
              New Mission
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 text-red-600 hover:text-red-800 font-medium">
              <LogOut size={20} /> Logout
            </button>
          </div>
        </header>
        {/* Map */}
        <div className="relative h-screen w-screen overflow-hidden">
          <Map
            newMissionMode={newMissionMode}
            drawType={drawType}
            selectedField={selectedField}
            onFieldSaved={handleFieldSaved}
          />
        </div>
      </div>
      {sidebarOpen && <div className="fixed inset-0 bg-black opacity-40 z-30" onClick={() => setSidebarOpen(false)}></div>}
      {/* Step 1 modal: choose Existing or New */}
      {showMissionPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
          <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center gap-6 w-96">
            <h2 className="text-xl font-semibold text-gray-800">Start a New Mission</h2>
            <div className="flex gap-4 w-full">
              <button onClick={chooseExistingField} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-bold text-lg">Existing Field</button>
              <button onClick={chooseNewField} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 rounded-lg font-bold text-lg">New Field</button>
            </div>
            <button onClick={() => setShowMissionPopup(false)} className="mt-4 w-full bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 rounded-lg font-semibold">Cancel</button>
          </div>
        </div>
      )}
      {/* Step 2 modal: existing fields */}
      {showExistingPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
          <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col gap-4 w-96">
            <h2 className="text-xl font-semibold text-gray-800">Select Existing Field</h2>
            {existingFields.map((field) => (
              <button
                key={field.id}
                onClick={() => handleSelectExistingField(field)}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition"
              >
                {field.name}
              </button>
            ))}
            <button onClick={() => setShowExistingPopup(false)} className="mt-2 w-full bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 rounded-lg font-semibold">Cancel</button>
          </div>
        </div>
      )}
      {/* Step 3 modal: draw type for new field */}
      {showDrawTypePopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
          <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col gap-4 w-96">
            <h2 className="text-xl font-semibold text-gray-800">Select Draw Type</h2>
            <div className="flex gap-4 w-full">
              <button onClick={() => selectDrawType("polygon")} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold">Polygon</button>
              <button onClick={() => selectDrawType("polyline")} className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-3 rounded-lg font-semibold">Polyline</button>
            </div>
            <button onClick={() => setShowDrawTypePopup(false)} className="mt-2 w-full bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 rounded-lg font-semibold">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoggedInHomePage;
