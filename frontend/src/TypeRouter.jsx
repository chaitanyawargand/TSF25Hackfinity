import { useSelector } from "react-redux";
import {
  createRoutesFromElements,
  Route,
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import React from 'react'
import HomePage from "./components/HomePage";
import Map from './components/DroneMap.jsx';
import Sidebar from "./components/sidebar.jsx";
import LoggedInHomePage from "./components/LoggedInHomePage";
import OAuthSuccess from "./components/Success.jsx";
import JwtLogin from "./components/jwtLogin.jsx";
const TypeRouter = () => {
  const type = useSelector((state) => state.Type?.value);
  let isLoggedIn = useSelector((state)=>state.isLoggedIn?.value);
  let routes;

  if(type==='user'){
    routes = createRoutesFromElements(
      <>
        {isLoggedIn?<Route path="/" element={<LoggedInHomePage/>} />:<Route path="/" element={<LoggedInHomePage/>} />}
        <Route path="/oauth-success" element={<OAuthSuccess />} />
        <Route path="/userlogin" element={<JwtLogin />} />
      </>
    );
  }
  const router = createBrowserRouter(routes);
  return <RouterProvider router={router} />;
}

export default TypeRouter