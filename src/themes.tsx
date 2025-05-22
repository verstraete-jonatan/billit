import { ThemeProvider } from "@emotion/react";
import { createTheme } from "@mui/material";
import { PropsWithChildren } from "react";
import { useUserStore } from "./store";

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

export const lightTheme = createTheme({
  palette: {
    mode: "light",
  },
});

export const Theme = ({
  isDarkMode,
  showGradient,
  children,
}: PropsWithChildren<{ isDarkMode?: boolean; showGradient?: boolean }>) => {
  const userDarkMode = useUserStore().user.darkMode;
  isDarkMode ??= userDarkMode;

  const gradient = `bg-radial-[at_95%_25%] ${
    isDarkMode ? "to-[#050108]" : "to-[#fafefd]"
  } ${isDarkMode ? "from-[#121417]" : "from-[#fdfaf8]"} to-70%`;

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <main
        className={`${isDarkMode ? "dark" : "light"} ${
          showGradient ? gradient : ""
        } text-foreground bg-background`}
      >
        {children}
      </main>
    </ThemeProvider>
  );
};
