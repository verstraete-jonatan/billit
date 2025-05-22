import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router";

import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

import { Sidebar } from "./components/Sidebar";

import { AppRoutes } from "./Routes";
import { Theme } from "./themes";

import "./index.css";

const App = () => {
  return (
    <HashRouter>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <HeroUIProvider locale="en-US">
          <ToastProvider />
          <Theme showGradient>
            <div
              className={`flex h-screen w-screen ${
                // "bg-radial-[at_25%_25%] from-[#010002] to-[#222] to-75%"
                // "bg-radial-[at_95%_25%] to-[#050108] from-[#121417] to-70%"
                ""
              }`}
            >
              <Sidebar />
              <div className="flex-grow">
                <AppRoutes />
              </div>
            </div>
          </Theme>
        </HeroUIProvider>
      </LocalizationProvider>
    </HashRouter>
  );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
