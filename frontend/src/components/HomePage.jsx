import React from "react";
import GoogleLogin from "./GoogleLogin.jsx";
import { LogIn } from "lucide-react";

const HomePage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-100 text-gray-800 px-6">
      {/* Header / Branding */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-indigo-700 tracking-tight drop-shadow-sm">
          Welcome to AgriGCS
        </h1>
        <p className="mt-3 text-gray-600 text-lg">
          Seamless login. Smarter access. Simplified workflow.
        </p>
      </div>

      {/* Card Container */}
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md text-center border border-gray-100">
        <h2 className="text-2xl font-semibold mb-4 flex items-center justify-center gap-2">
          <LogIn className="text-indigo-600" /> Sign In
        </h2>
        <p className="text-gray-500 mb-6">
          Use your Google account to get started with AgriGCS
        </p>

        <div className="flex justify-center">
          <GoogleLogin />
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 text-sm text-gray-500">
        © {new Date().getFullYear()} AgriGCS — All rights reserved.
      </footer>
    </div>
  );
};

export default HomePage;
