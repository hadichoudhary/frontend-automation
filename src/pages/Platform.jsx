import { useEffect, useState } from "react";
import PlatformCard from "../components/platformCard";
import { PLATFORMS } from "../utils/platformsList";
// import FacebookLogin from "@greatsumini/react-facebook-login";
import toast from "react-hot-toast";
import style from "../css/platform.module.css";

/* ---------- LINKEDIN CONNECT ---------- */
const connectLinkedIn = () => {
  const token = localStorage.getItem("authToken");
  if (!token) {
    toast.error("Please login first");
    return;
  }

  const safeState = btoa(token);
  console.log("safestate",safeState);
  

  const params = new URLSearchParams({
    response_type: "code",
    client_id: `${import.meta.env.VITE_CLIENT_ID}`,
    redirect_uri: `${import.meta.env.VITE_BACKEND_URL}/api/platforms/linkedinCallback`,
    scope: "openid email profile w_member_social",
    state: safeState,
  });

  window.location.href =
    `${import.meta.env.VITE_LINKDIN_AUTH_LINK}?` +
    params.toString();
};

const Platforms = () => {
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      toast.error("Please login first");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/platforms/linkedinStatus`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      const data = await res.json();
      console.log("API Response:", data); 

      if (!data.success) {
        console.error("API returned error:", data.message);
        toast.error("Failed to fetch platform status");
        return;
      }

      const connectedPlatformsMap = {};
      if (data.platforms && Array.isArray(data.platforms)) {
        data.platforms.forEach(platform => {
          if (platform.platform) {
            const platformName = platform.platform.toLowerCase();
            connectedPlatformsMap[platformName] = {
              isConnected: platform.status === "connected",
              accountName: platform.accountName || "",
              platformData: platform
            };
          }
        });
      }

      console.log("Connected Platforms Map:", connectedPlatformsMap); 
      setPlatforms(prevPlatforms => {
        const updatedPlatforms = PLATFORMS.map(p => {
          const platformName = p.value.toLowerCase();
          const connectedInfo = connectedPlatformsMap[platformName];
          
          return {
            platform_name: p.value,
            is_connected: connectedInfo ? connectedInfo.isConnected : false,
            platform_username: connectedInfo ? connectedInfo.accountName : "",
            platform_data: connectedInfo ? connectedInfo.platformData : null
          };
        });
        
        console.log("Updated Platforms:", updatedPlatforms); 
        return updatedPlatforms;
      });

    } catch (err) {
      console.error("Fetch Status Error:", err);
      toast.error("Failed to fetch platform status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    
    const intervalId = setInterval(fetchStatus, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  const disconnect = async (platformName) => {
    if (!window.confirm(`Are you sure you want to disconnect ${platformName}?`)) {
      return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) {
      toast.error("Please login first");
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/platforms/disconnect/${platformName.toLowerCase()}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            platform: platformName
          }),
        }
      );

      const data = await res.json();
      console.log("Disconnect Response:", data); 
      if (!data.success) {
        throw new Error(data.message || "Disconnect failed");
      }

      toast.success(`${platformName} disconnected successfully`);
      
      setPlatforms(prevPlatforms => 
        prevPlatforms.map(p => 
          p.platform_name === platformName 
            ? { ...p, is_connected: false, platform_username: "" }
            : p
        )
      );

      setTimeout(fetchStatus, 1000);

    } catch (error) {
      console.error("Disconnect Error:", error);
      toast.error(`Failed to disconnect ${platformName}: ${error.message}`);
    }
  };

  // const connectFacebook = async (fbRes) => {
  //   try {
  //     const token = localStorage.getItem("authToken");
  //     if (!token) {
  //       toast.error("Please login first");
  //       return;
  //     }

  //     const res = await fetch(
  //       "http://localhost:4000/api/platforms/facebookCallback",
  //       {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //           Authorization: `Bearer ${token}`,
  //         },
  //         body: JSON.stringify({
  //           accessToken: fbRes.accessToken,
  //           userID: fbRes.userID,
  //           expiresIn: fbRes.expiresIn,
  //         }),
  //       }
  //     );

  //     const data = await res.json();
  //     console.log("Facebook Connect Response:", data); 

  //     if (!data.success) {
  //       throw new Error(data.message || "Facebook connection failed");
  //     }

  //     toast.success("Facebook connected successfully");
      
  //     setPlatforms(prevPlatforms => 
  //       prevPlatforms.map(p => 
  //         p.platform_name === "Facebook" 
  //           ? { ...p, is_connected: true, platform_username: data.userName || "" }
  //           : p
  //       )
  //     );

  //     setTimeout(fetchStatus, 1000);

  //   } catch (error) {
  //     console.error("Facebook Connect Error:", error);
  //     toast.error(`Facebook connection failed: ${error.message}`);
  //   }
  // };

  if (loading) {
    return (
      <div className={style.platformsContainer}>
        <div className={style.loadingContainer}>
          <div className={style.spinner}></div>
          <p>Loading platform connections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={style.platformsContainer}>
      <h1>Manage Platforms</h1>
      <p>Connect your social media accounts</p>

      <div className={style.platforms}>
        {platforms.map((p) => {
          const meta = PLATFORMS.find(
            (x) => x.value === p.platform_name
          );

          return (
            <PlatformCard
              key={p.platform_name}
              name={p.platform_name}
              Icon={meta.icon}
              color={meta.color}
              isConnected={p.is_connected}
              username={p.platform_username}
              onConnect={
                p.platform_name === "LinkedIn"
                  ? connectLinkedIn
                  : undefined
              }
              onDisconnect={() => disconnect(p.platform_name)}
            >
              {/* {p.platform_name === "Facebook" && !p.is_connected && (
                <FacebookLogin
                  appId="891510656873524"
                  onSuccess={connectFacebook}
                  onFail={(error) => {
                    console.error("Facebook Login Error:", error);
                    toast.error("Facebook login failed");
                  }}
                  
                  render={({ onClick }) => (
                    <button 
                      onClick={onClick}
                      className={style.facebookButton}
                    >
                      Connect Facebook
                    </button>
                  )}
                />
              )} */}
            </PlatformCard>
          );
        })}
      </div>


    </div>
  );
};

export default Platforms;