import React, { useState, useEffect, useRef} from "react";
import { useDispatch, useSelector } from "react-redux";
import { toggler } from "../features/isLoggedIn";
import { Menu, X, LogOut } from "lucide-react";
import Map from "./DroneMap";
import axios from "axios";

const LoggedInHomePage = () => {
  const [newMissionMode, setNewMissionMode] = useState(false);
  const [drawType, setDrawType] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [missionCreated, setmissionCreated] = useState(false);
  const [Play, setPlay] = useState(true);
  const [newField, setnewField] = useState(false);
  const socketRef = useRef(null);
  const Id=useSelector((state)=>state.Id?.value);
  // modals
  const [showMissionPopup, setShowMissionPopup] = useState(false); // choose existing/new
  const [showExistingPopup, setShowExistingPopup] = useState(false); // list of existing fields
  const [showDrawTypePopup, setShowDrawTypePopup] = useState(false); // choose polygon/polyline for new field

  // selected field object passed to Map (include timestamp so re-selection triggers)
  const [selectedField, setSelectedField] = useState(null);

  // Dummy existing fields (replace with DB/API call later)
  const existingFields = [
    {
      id: 1,
      name: "Field A",
      coords: [
        { lat: 20.593, lng: 78.962 },
        { lat: 20.595, lng: 78.963 },
        { lat: 20.596, lng: 78.961 },
      ],
    },
    {
      id: 2,
      name: "Field B",
      coords: [
        { lat: 20.598, lng: 78.965 },
        { lat: 20.599, lng: 78.966 },
        { lat: 20.601, lng: 78.964 },
      ],
    },
  ];

  const [missions, setMissions] = useState([]);
  const dispatch = useDispatch();
  const userName = useSelector((state) => state.Name?.value);

  const handleLogout = () => dispatch(toggler());

  // Step 1: open existing/new choice popup
  const startNewMission = () => {
    setShowMissionPopup(true);
  };

  // Existing field flow: show list of existing fields
  const chooseExistingField = () => {
    setShowMissionPopup(false);
    setShowExistingPopup(true);
    setnewField(false);
  };

  const handleSelectExistingField = (field) => {
    setShowExistingPopup(false);
    setSelectedField({ ...field, _selectedAt: Date.now() });
    setNewMissionMode(false);
    setDrawType(null);
    setnewField(true);
  };

  // New field flow: show draw-type popup (polygon / polyline)
  const chooseNewField = () => {
    setShowMissionPopup(false);
    setShowDrawTypePopup(true);
  };

  // When user chooses draw type for new field
  const selectDrawType = (type) => {
    setDrawType(type);
    setNewMissionMode(true); // enable drawing tools in Map
    setShowDrawTypePopup(false);
    setSelectedField(null); // clear any selected existing field
  };


  //creating websocket connectiom
  const handleMissionCreated = async (mission) => {
    console.log("handlemissioncalled");
    setMissions((prev) => [...prev, mission]);
    setmissionCreated(true);
    setNewMissionMode(false);
    setDrawType(null);
    console.log("nf",newField);
    if(newField){
      const payload= {
        id:Id,
        coords: missionData.coords
      }
      try {
      const response = await axios.post("http://localhost:4000/newfield", payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log("create new field: ",response);
  } catch (error) {
    console.error("ERROR", error);
    throw error;
  }
    }
    console.log("📤 Sending mission data:", mission);

    // ✅ Send mission data to backend WebSocket
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        command: "NEW_MISSION",
        data: mission,
      }));
    } else {
      console.warn("⚠️ WebSocket not open; could not send mission data");
    }
  };

  // --- Playback controls ---
  const sendCommand = (cmd) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ command: cmd }));
      console.log(`📤 Sent command: ${cmd}`);
    } else {
      console.warn("⚠️ WebSocket not connected");
    }
  };  useEffect(() => {
    const socket = new WebSocket("ws://localhost:3000");
    socket.onopen = () =>{
      console.log("connected to websocket");
    }

    socket.onmessage = (event) =>{
      const msg=JSON.parse(event.data);

    }
    return () => {
      socket.close();
    }
  }, [])

  // Called by Map when it finished handling selectedField (either saved or cancelled)
  const handleSelectedFieldHandled = () => {
    setSelectedField(null);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } w-64 z-50`}
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

      {/* Main */}
      <div className="flex-1 flex flex-col">
        <header className="flex justify-between items-center bg-white shadow px-6 py-3 z-40">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-700 hover:text-gray-900">
            <Menu size={28} />
          </button>

          <h1 className="text-lg font-semibold text-gray-800">{`Dashboard`}</h1>

          <div className="flex items-center gap-4">
            {!missionCreated && <button
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg font-medium transition-colors"
              onClick={startNewMission}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Mission
            </button>}

            {missionCreated && <div>
              {Play&&<button onClick={() => { setPlay(true); sendCommand("PLAY"); }}>Play</button>}
              {!Play && <button onClick={() => { setPlay(false); sendCommand("PAUSE"); }}>Pause</button>}
              <button onClick={() => sendCommand("ABORT")}>Abort</button>
            </div>

            }

            <button onClick={handleLogout} className="flex items-center gap-2 text-red-600 hover:text-red-800 font-medium">
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </header>

        {/* Map container */}
        <div className="relative h-screen w-screen overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Map
              newMissionMode={newMissionMode}
              drawType={drawType}
              selectedField={selectedField}
              onMissionCreated={handleMissionCreated}
              onSelectedFieldHandled={handleSelectedFieldHandled}
            />
          </div>
        </div>
      </div>

      {/* Sidebar overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black opacity-40 z-30" onClick={() => setSidebarOpen(false)}></div>}

      {/* Step 1 modal: choose Existing or New */}
      {showMissionPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
          <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center gap-6 w-96">
            <h2 className="text-xl font-semibold text-gray-800">Start a New Mission</h2>
            <div className="flex gap-4 w-full">
              <button onClick={chooseExistingField} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-bold text-lg">
                Existing Field
              </button>
              <button onClick={chooseNewField} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 rounded-lg font-bold text-lg">
                New Field
              </button>
            </div>
            <button onClick={() => setShowMissionPopup(false)} className="mt-4 w-full bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 rounded-lg font-semibold">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Step 2 modal: list of existing fields */}
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
            <button onClick={() => setShowExistingPopup(false)} className="mt-2 w-full bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 rounded-lg font-semibold">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Draw type modal for NEW field (polygon / polyline) */}
      {showDrawTypePopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
          <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col gap-4 w-96">
            <h2 className="text-xl font-semibold text-gray-800">Select Draw Type</h2>
            <div className="flex gap-4 w-full">
              <button onClick={() => selectDrawType("polygon")} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold">
                Polygon
              </button>
              <button onClick={() => selectDrawType("polyline")} className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-3 rounded-lg font-semibold">
                Polyline
              </button>
            </div>
            <button onClick={() => setShowDrawTypePopup(false)} className="mt-2 w-full bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 rounded-lg font-semibold">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoggedInHomePage;
