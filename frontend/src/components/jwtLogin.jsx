import React, { useState } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import {toggler} from "../features/isLoggedIn"
import { setEmail } from "../features/Email";
import { setName } from "../features/Name";
import { useNavigate } from "react-router-dom";

const JwtLogin = () => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({ username: "", password: ""});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
  // handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:4000/auth/login", formData);
    
      if (res.data.token) {
        // Save JWT in localStorage
        console.log(res.data);
        localStorage.setItem("token", res.data.token);

        // Dispatch to Redux
        dispatch(toggler());
        dispatch(setName(res.data.user.displayName));
        dispatch(setEmail(res.data.user.email));
        navigate('/');

        
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Invalid username or password. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-orange-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-orange-600">
          Login with Username & Password
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm text-center mt-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 text-white font-semibold py-2 rounded-lg hover:bg-orange-700 transition duration-200 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default JwtLogin;
