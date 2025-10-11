import React from "react";
import { Menu, Plus, Home, Map, Settings, Layers } from "lucide-react";

const Sidebar = ({ open, setOpen, activeTab, setActiveTab }) => {
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: <Home size={18} /> },
    { id: "fields", label: "Fields", icon: <Layers size={18} /> },
    { id: "missions", label: "Missions", icon: <Map size={18} /> },
    { id: "settings", label: "Settings", icon: <Settings size={18} /> },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-gray-900 text-white transition-all duration-300 z-50
        ${open ? "w-64" : "w-16"} 
        ${open ? "translate-x-0" : "-translate-x-64"} 
        md:translate-x-0 shadow-lg`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          {open && <h1 className="text-lg font-bold text-cyan-400">Hackathon UI</h1>}
          <button
            onClick={() => setOpen(!open)}
            className="p-2 rounded-md hover:bg-gray-800 transition md:hidden"
          >
            <Menu size={20} />
          </button>
        </div>

        {/* Tabs */}
        <ul className="flex-1 flex flex-col mt-4">
          {tabs.map((tab) => (
            <li
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 cursor-pointer px-4 py-3 rounded-lg mb-1 transition-all 
              ${activeTab === tab.id ? "bg-cyan-800 text-cyan-200" : "hover:bg-gray-800 hover:text-cyan-400"}`}
            >
              <span>{tab.icon}</span>
              {open && <span className="font-medium">{tab.label}</span>}
            </li>
          ))}
        </ul>

        {/* Footer */}
        {open && (
          <div className="p-4 border-t border-gray-800">
            <button className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md transition">
              <Plus size={16} />
              Add New Field
            </button>
          </div>
        )}
      </div>

      {/* Hamburger button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 p-2 bg-gray-900 text-white rounded-md z-50 md:hidden shadow-lg"
      >
        <Menu size={20} />
      </button>
    </>
  );
};

export default Sidebar;
