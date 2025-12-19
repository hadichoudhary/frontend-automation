import { useState, useEffect } from "react";
import axios from "axios";
import style from "../css/sidebar.module.css";
import { FaHouse } from "react-icons/fa6";
import { IoCloudUploadSharp } from "react-icons/io5";
import { FaSitemap } from "react-icons/fa";
import { MdOutlineListAlt } from "react-icons/md";
import { FiLogOut } from "react-icons/fi";
import { IoMdSettings } from "react-icons/io";
import { TbPrompt } from "react-icons/tb";
import { HiMenu, HiX } from "react-icons/hi";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";

const WebLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const logout = () => {
    localStorage.removeItem("authToken");
    navigate("/login", { replace: true });
  };


  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) return;

        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/settings/profile`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setUser({
          name: response.data.data.name,
          email: response.data.data.email,
          platforms: response.data.data.platforms || [],
        });
      } catch (error) {
        console.error("Failed to fetch user profile", error);
      }
    };

    fetchUser();
  }, []);

  const userInitial = user?.name?.charAt(0).toUpperCase() || "U";

  return (
    <div className={style.layoutWrapper}>
      <header className={style.headerContainer}>
        <div className={style.headerLeft}>
          <button
            className={style.hamburger}
            onClick={() => setSidebarOpen(true)}
          >
            <HiMenu />
          </button>
        </div>

        <div className={style.headerContent}>
          <div className={style.user} >
            <div className={style.userIcon} onClick={()=>navigate('/setting')}>{userInitial}</div>
          </div>
        </div>
      </header>

      <div className={style.bodyWrapper}>
        {sidebarOpen && (
          <div
            className={style.overlay}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={`${style.sidebarContainer} ${
            sidebarOpen ? style.sidebarOpen : ""
          }`}
        >
          <div className={style.sidebarHeader}>
            <div className={style.sidebarLogoContainer}>
              <span className={style.logoText}>SocialSync</span>
            </div>
            <HiX
              className={style.closeIcon}
              onClick={() => setSidebarOpen(false)}
            />
          </div>

          <div className={style.sidebarContent}>
            <ul className={style.sidebarList}>
              <Link to="/" className={`${style.sidebarListsItem} ${isActive("/") && style.activeItem}`}>
                <FaHouse /> Dashboard
              </Link>

              <Link to="/uploads" className={`${style.sidebarListsItem} ${isActive("/uploads") && style.activeItem}`}>
                <IoCloudUploadSharp /> Upload Posts
              </Link>

              <Link to="/platforms" className={`${style.sidebarListsItem} ${isActive("/platforms") && style.activeItem}`}>
                <FaSitemap /> Manage Platforms
              </Link>

              <Link to="/posts" className={`${style.sidebarListsItem} ${isActive("/posts") && style.activeItem}`}>
                <MdOutlineListAlt /> Posts
              </Link>

              <Link to="/prompt" className={`${style.sidebarListsItem} ${isActive("/prompt") && style.activeItem}`}>
                <TbPrompt /> Prompt
              </Link>

              <Link to="/setting" className={`${style.sidebarListsItem} ${isActive("/setting") && style.activeItem}`}>
                <IoMdSettings /> Settings
              </Link>
            </ul>

            <div className={style.logout} onClick={logout}>
              <FiLogOut /> Logout
            </div>
          </div>
        </aside>

        <main className={style.mainContent}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default WebLayout;
