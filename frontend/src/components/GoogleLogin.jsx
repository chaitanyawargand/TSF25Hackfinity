import React from "react";
import { FcGoogle } from "react-icons/fc";
import { User } from "lucide-react";
import "../../src/index.css";
import { useNavigate } from "react-router-dom";

const GoogleLogin = () => {
  const navigate=useNavigate();
  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:4000/auth/google";
  };

  const handleUsernameLogin = () => {
    navigate("/userlogin");
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-sm mx-auto">
      {/* Google Login */}
      <button
        onClick={handleGoogleLogin}
        className="flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 font-medium px-6 py-3 rounded-lg shadow-sm hover:bg-gray-50 transition duration-200"
      >
        <FcGoogle size={22} />
        Continue with Google
      </button>

      {/* Divider */}
      <div className="flex items-center justify-center gap-3 text-gray-400">
        <div className="h-px w-1/3 bg-gray-300"></div>
        or
        <div className="h-px w-1/3 bg-gray-300"></div>
      </div>

      {/* Username + Password Login */}
      <button
        onClick={handleUsernameLogin}
        className="flex items-center justify-center gap-3 bg-[#FF6B00] text-white font-semibold px-6 py-3 rounded-lg hover:bg-orange-600 transition duration-200 shadow"
      >
        <User size={20} />
        Login with Username & Password
      </button>
    </div>
  );
};

export default GoogleLogin;
