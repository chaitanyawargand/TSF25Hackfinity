import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toggler } from "../features/isLoggedIn"; // adjust path as needed
import { Menu, X, LogOut } from "lucide-react";

const LoggedInHomePage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dispatch = useDispatch();
  const userName=useSelector((state)=>state.Name?.value);
  const handleLogout = () => {
    dispatch(toggler());
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
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
        <header className="flex justify-between items-center bg-white shadow px-6 py-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-700 hover:text-gray-900"
          >
            <Menu size={28} />
          </button>

          <h1 className="text-lg font-semibold text-gray-800">
           {`Dashboard`}
          </h1>
        
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-600 hover:text-red-800 font-medium"
          >
            <LogOut size={20} />
            Logout
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
        
        </main>
      </div>

      {/* Overlay for mobile when sidebar open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black opacity-40 z-10"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default LoggedInHomePage;
