import { Route, Routes, HashRouter } from "react-router-dom";
import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import { Sidebar } from "./components/Sidebar";

import { ContactsPage } from "./pages/ContactsPage";
import { BillsOverview } from "./pages/BillsPage";
import { CreateBill } from "./pages/CreatePage";
import { QROnlyPage } from "./pages/QrOnly";

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
          <HeroUIProvider>
            <ToastProvider />
            <main className="dark text-foreground bg-background">
              <div className="flex h-screen w-screen">
                <Sidebar />
                <div className="flex-grow">
                  <Routes>
                    <Route path="/create/:bill_id?" element={<CreateBill />} />
                    <Route path="/bills" element={<BillsOverview />} />
                    <Route path="/contacts" element={<ContactsPage />} />
                    <Route path="/qr-only" element={<QROnlyPage />} />
                  </Routes>
                </div>
              </div>
            </main>
          </HeroUIProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </HashRouter>
  );
};
