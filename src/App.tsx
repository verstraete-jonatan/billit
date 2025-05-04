import { HashRouter } from "react-router-dom";
import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import { Sidebar } from "./components/Sidebar";

import { AppRoutes } from "./Routes";
import { darkTheme } from "./themes";

export const App = () => {
  return (
    <HashRouter>
      <ThemeProvider theme={darkTheme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <HeroUIProvider locale="en-US">
            <ToastProvider />
            <main className="dark text-foreground bg-background">
              <div
                className={`flex h-screen w-screen ${
                  // "bg-radial-[at_25%_25%] from-[#010002] to-[#222] to-75%"
                  "bg-radial-[at_95%_25%] to-[#050108] from-[#121417] to-70%"
                }`}
              >
                <Sidebar />
                <div className="flex-grow">
                  <AppRoutes />
                </div>
              </div>
            </main>
          </HeroUIProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </HashRouter>
  );
};
