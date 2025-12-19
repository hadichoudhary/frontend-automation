import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";

const ProtectedRoutes = ({ children }) => {
  const [isValid, setIsValid] = useState(null);
  const token = localStorage.getItem("authToken");

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsValid(false);
        return;
      }

      try {
        await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/check/verify-token`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setIsValid(true);
      } catch (error) {
        localStorage.removeItem("authToken");
        setIsValid(false);
      }
    };

    verifyToken();
  }, [token]);

  if (isValid === null) return null; 
  if (!isValid) return <Navigate to="/login" replace />;

  return children;
};

export default ProtectedRoutes;
