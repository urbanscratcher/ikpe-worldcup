import { createBrowserRouter } from "react-router";
import { AdminPage } from "../pages/AdminPage";
import { AudiencePage } from "../pages/AudiencePage";
import { EnterPage } from "../pages/EnterPage";
import { HostPage } from "../pages/HostPage";
import { RegisterPage } from "../pages/RegisterPage";
import { SoundPage } from "../pages/SoundPage";

export const router = createBrowserRouter([
  { path: "/", element: <AudiencePage /> },
  { path: "/enter", element: <EnterPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/admin", element: <AdminPage /> },
  { path: "/host", element: <HostPage /> },
  { path: "/sound", element: <SoundPage /> },
]);
