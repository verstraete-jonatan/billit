import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router";
import { AppPath, AppType } from "src/Routes";

export const useNav = () => {
  const nav = useNavigate();

  return useCallback(
    (route: AppType | AppPath) => {
      nav(route);
    },
    [nav]
  );
};
