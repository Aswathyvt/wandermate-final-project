import Home from "./components/Home";
import Login from "./components/Login";
import MainLayout from "./components/MainLayout";
import Signup from "./components/Signup";
import Profile from "./components/Profile";
import EditProfile from "./components/EditProfile";
import ChatPage from "./components/ChatPage";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { io } from "socket.io-client";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setOnlineUsers } from "./redux/chatSlice";
import { setSocket } from "./redux/socketSlice";
import { setLikeNotification } from "./redux/rtnSlice";
import ProtectedRoutes from "./components/ProtectedRoutes";

const browserRouter = createBrowserRouter([
  {
    path: "/",
    element: (
      <ProtectedRoutes>
        <MainLayout />
      </ProtectedRoutes>
    ),
    children: [
      {
        path: "/",
        element: (
          <ProtectedRoutes>
            <Home />
          </ProtectedRoutes>
        ),
      },
      {
        path: "/profile/:id",
        element: (
          <ProtectedRoutes>
            {" "}
            <Profile />
          </ProtectedRoutes>
        ),
      },
      {
        path: "/account/edit",
        element: (
          <ProtectedRoutes>
            <EditProfile />
          </ProtectedRoutes>
        ),
      },
      {
        path: "/chat",
        element: (
          <ProtectedRoutes>
            <ChatPage />
          </ProtectedRoutes>
        ),
      },
    ],
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/signup",
    element: <Signup />,
  },
]);

function App() {
  const { user } = useSelector((store) => store.auth);
  const { socket } = useSelector((store) => store.socketio);
  const dispatch = useDispatch();

  useEffect(() => {
    if (user) {
      // Ensures socket connection is only initialized once
      const socketio = io("http://localhost:8000", {
        query: { userId: user?._id },
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
      });

      dispatch(setSocket(socketio));

      // Listen for online users

      socketio.on("connect", () => {
        console.log("Socket connected successfully");
        dispatch(setSocket(socketio));
      });

      socketio.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
      });

      socketio.on("getOnlineUsers", (onlineUsers) => {
        console.log("Online users received:", onlineUsers);
        dispatch(setOnlineUsers(onlineUsers));
      });

      socketio.on("notification", (notification) => {
        console.log("Notification received:", notification);
        dispatch(setLikeNotification(notification));
      });

      // Clean up socket on component unmount or when user changes
      return () => {
        socketio.disconnect();
        dispatch(setSocket(null));
      };
    } else if (socket) {
      socket?.disconnect();
      dispatch(setSocket(null));
      dispatch(clearNotifications());
    }
  }, [user, dispatch]);

  return (
    <>
      <RouterProvider router={browserRouter} />
    </>
  );
}

export default App;
