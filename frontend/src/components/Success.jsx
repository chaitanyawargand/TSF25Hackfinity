import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setEmail } from "../features/Email";
import { setName } from "../features/Name";

function OAuthSuccess() {
  const location = useLocation();
  const dispatch = useDispatch();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const userStr = params.get("user");
    if (userStr) {
      const user = JSON.parse(decodeURIComponent(userStr));
      dispatch(setID(user.id));
      dispatch(setName(user.displayName));
      dispatch(setEmail(user.email));
    }
  }, []);

  return <div>Login successful! Welcome.</div>;
}

export default OAuthSuccess;
