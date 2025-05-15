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
  children,
}: PropsWithChildren<{ isDarkMode?: boolean }>) => {
  const userDarkMode = useUserStore().user.darkMode;
  isDarkMode ??= userDarkMode;

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <main
        className={`${
          isDarkMode ? "dark" : "light"
        } text-foreground bg-background`}
      >
        {children}
      </main>
    </ThemeProvider>
  );
};
