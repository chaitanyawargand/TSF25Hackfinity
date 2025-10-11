import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toggler } from "../features/isLoggedIn";
import { Menu, X, LogOut } from "lucide-react";
import Map from './DroneMap'


const LoggedInHomePage = () => {
  const [newMissionMode, setNewMissionMode] = useState(false);
   const [drawType, setDrawType] = useState(null); 
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPopup, setShowPopup] = useState(false); 
  const dispatch = useDispatch();
  const userName=useSelector((state)=>state.Name?.value);
  const handleLogout = () => {
    dispatch(toggler());
  };
    const startNewMission = () => {
    setShowPopup(true);
  };
   const selectDrawType = (type) => {
    setDrawType(type);
    setNewMissionMode(true); 
    setShowPopup(false);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`fixed top-0 z-50 left-0 h-full bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } w-64 z-20`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Menu</h2>
          <button onClick={() => setSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav className="p-4 space-y-3">
          <a href="#" className="block text-gray-700 hover:text-blue-600">
            View Previous Missions
          </a>
          
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex justify-between items-center bg-white shadow px-6 py-3 z-40">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-700 hover:text-gray-900"
          >
            <Menu size={28} />
          </button>

          <h1 className="text-lg font-semibold text-gray-800">
           {`Dashboard`}
          </h1>
           <div className="flex items-center gap-4">
    {/* New Mission Button */}
    <button
      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg font-medium transition-colors"
      onClick={startNewMission}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      New Mission
    </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-600 hover:text-red-800 font-medium"
          >
            <LogOut size={20} />
            Logout
          </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="relative h-screen w-screen overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Map newMissionMode={newMissionMode} drawType={drawType} />
          </div>
        </div>
      </div>

      {/* Overlay for mobile when sidebar open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black opacity-40 z-30"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
       {showPopup && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center gap-6 w-96">
      <h2 className="text-xl font-semibold text-gray-800">Select Mission Type</h2>
      <div className="flex gap-4 w-full">
        <button
          onClick={() => selectDrawType("polygon")}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-bold transition-colors text-lg"
        >
          Polygon
        </button>
        <button
          onClick={() => selectDrawType("polyline")}
          className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-4 rounded-lg font-bold transition-colors text-lg"
        >
          Custom
        </button>
      </div>
      {/* Cancel Button */}
      <button
        onClick={() => setShowPopup(false)}
        className="mt-4 w-full bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 rounded-lg font-semibold transition-colors"
      >
        Cancel
      </button>
    </div>
  </div>
)}
    </div>
  );
};
export default LoggedInHomePage;

