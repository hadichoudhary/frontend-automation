import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import Uploads from "./pages/Upload";
import Platforms from "./pages/Platform";
import Posts from "./pages/Posts";
import ProtectedRoutes from "./components/protectedRoutes";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import WebLayout from "./pages/WebLayout";
import { Toaster } from "react-hot-toast";
import Settings from "./pages/setting";
import PromptPage from "./pages/PromptPage";


const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoutes>
        <WebLayout />
      </ProtectedRoutes>
    ),
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/uploads', element: <Uploads /> },
      { path: '/Platforms', element: <Platforms /> },
      { path: '/Posts', element: <Posts /> },
      {path:'/setting',element:<Settings/>},
      {path:'/prompt',element:<PromptPage/>}
    ]
  },
  {
    path: '/login', element: <Login />
  },
  {
    path: '/signup', element: <Signup />
  }
])


function App() {
  return (
    <>
      <Toaster position="top-right" />
      <RouterProvider router={router} />
    </>
  )
}

export default App
