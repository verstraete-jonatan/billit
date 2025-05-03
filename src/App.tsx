import { HashRouter } from "react-router-dom";
import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import { Sidebar } from "./components/Sidebar";

import { AppRoutes } from "./Router";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

export const App = () => {
  return (
    <HashRouter>
      <ThemeProvider theme={darkTheme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <HeroUIProvider locale="en-US">
            <ToastProvider />
            <main className="dark text-foreground bg-background">
              <div className="flex h-screen w-screen">
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
