import { Link, useLocation } from "react-router";

import { Button, useDisclosure } from "@heroui/react"; // Assuming HeroUI components
import { EditUserModal } from "./EditUserModal";

import { navItems } from "src/Routes";
import {
  ArrowLeftStartOnRectangleIcon,
  EyeIcon,
  MoonIcon,
  SunIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { useUserStore } from "src/store";
import { useNav } from "src/utils/useNav";
import logo from "../assets/logo.png";
import { useContext } from "react";
import { AuthContext } from "src/providers/AuthProvider";

export const Sidebar = () => {
  const location = useLocation();
  const nav = useNav();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { logOut } = useContext(AuthContext);

  const { user, setUser } = useUserStore();

  const isDarkMode = user.darkMode;

  return (
    <aside
      className={`w-64 h-full flex flex-col justify-between border-gray-100 shadow-lg overflow-y-scroll overflow-x-hidden ${
        isDarkMode
          ? "bg-[#0A0A0A] text-white shadow-[#444]"
          : "bg-[#fefefe] text-black shadow-[#aaa]"
      }`}
    >
      <nav>
        <div className="p-6 mb-10">
          <div
            className="flex items-center justify-center cursor-pointer"
            onClick={() => nav("home")}
          >
            <img
              src={logo}
              alt="App Logo"
              className={`h-15 w-full object-contain`}
              style={{
                filter: isDarkMode ? "invert(1)" : "",
              }}
            />
          </div>
        </div>
        {navItems.map((item) => {
          const isActive = location.pathname.includes(item.path);
          return (
            <div key={item.name} className="list-none flex flex-col">
              <Link
                to={item.path}
                style={{
                  transformOrigin: "left",
                }}
                className={`flex items-center pl-4 py-3 transition-all ${
                  isActive
                    ? "border-l-8 font-black scale-105"
                    : `hover:font-bold hover:scale-105 ${
                        isDarkMode ? "text-grey" : "text-black"
                      }`
                } ${isDarkMode ? "hover:bg-[#333]" : "hover:bg-[#eee]"}`}
              >
                <item.icon className="h-5 w-5 mr-3 opacity-80" />
                {item.name}
              </Link>
            </div>
          );
        })}
      </nav>
      <nav className="mb-5">
        <div className="flex justify-evenly ">
          <Button
            onPress={logOut}
            variant="light"
            radius="none"
            className="flex-1 border border-[#aaa3]"
          >
            <ArrowLeftStartOnRectangleIcon className="h-auto w-5" />
            Logout
          </Button>

          <Button
            onPress={() => setUser({ darkMode: !isDarkMode })}
            variant="light"
            // isIconOnly
            radius="none"
            className="flex-1 border border-[#aaa3]"
          >
            {!isDarkMode ? (
              <MoonIcon className="h-auto w-5" />
            ) : (
              <SunIcon className="h-auto w-5" />
            )}
            {isDarkMode ? "Dark mode" : "Light mode"}
          </Button>
        </div>
        <EditUserModal isOpen={isOpen} onClose={onClose} />

        <div className="border-t border-gray-700">
          <Button
            onPress={onOpen}
            color="primary"
            variant="solid"
            radius="none"
            className="w-full"
            startContent={<UserIcon className="h-auto w-5" />}
          >
            Edit my Info
          </Button>
        </div>
      </nav>
    </aside>
  );
};
