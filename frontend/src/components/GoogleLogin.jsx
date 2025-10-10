import React from "react";

const GoogleLogin = () => {
  const handleLogin = () => {
    // redirect to backend Google OAuth
    window.location.href = "http://localhost:4000/auth/google";
  };

  return (
    <button
      className="flex items-center gap-3 bg-[#FF6B00] text-white font-semibold px-6 py-3 rounded-lg hover:bg-orange-600 transition duration-200 shadow"
      onClick={handleLogin}
    >
      Login With Google
    </button>
  );
};

export default GoogleLogin;
