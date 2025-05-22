import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router";
import { AppType } from "src/Routes";

export const useNav = () => {
  const nav = useNavigate();

  return useCallback(
    (route: AppType) => {
      nav(route);
    },
    [nav]
  );
};
