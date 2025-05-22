import { Link, useLocation } from "react-router";

import { Button, useDisclosure } from "@heroui/react"; // Assuming HeroUI components
import { EditUserModal } from "./EditUserModal";

import { navItems } from "src/Routes";
import {
  EyeIcon,
  MoonIcon,
  SunIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { useUserStore } from "src/store";

export const Sidebar = () => {
  const location = useLocation();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const { user, setUser } = useUserStore();

  const isDarkMode = user.darkMode;

  return (
    <aside
      className={`w-64 h-full flex flex-col border-r border-gray-700 shadow-xl overflow-y-scroll overflow-x-hidden ${
        isDarkMode ? "bg-[#0A0A0A] text-white" : "bg-[#fefefe] text-black"
      }`}
    >
      <div className="p-6">
        <div className="flex items-center justify-center">
          <img
            src="/logo.png"
            alt="App Logo"
            className="h-10 w-10 rounded-full object-cover"
          />
        </div>
      </div>
      <nav className="mt-10 flex-1">
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
                }`}
              >
                <item.icon className="h-5 w-5 mr-3 opacity-80" />
                {item.name}
              </Link>
            </div>
          );
        })}
      </nav>

      {/* <nav className="mr-5 mt-3 flex-1 text-[#aaa]">
        <hr className="mb-2 font-black  rounded-2xl" />
        <div
          className={`mb-2 flex items-center mx-4 px-4 py-3 rounded-lg transition-all duration-300 text-sm cursor-pointer text-gray-400 hover:bg-gray-800 hover:text-white`}
        >
          Invert colors
        </div>
      </nav>

      <div className="flex-1">
        <div className="*:my-2">
          <Button variant="light">
            <EyeIcon className="h-5 w-5 inline" />
            Invert
          </Button>
        </div>
      </div> */}
      <div className="p-6 border-t border-gray-700">
        <Button
          onPress={onOpen}
          color="secondary"
          variant="solid"
          startContent={<UserIcon className="h-auto w-5" />}
        >
          Edit my Info
        </Button>
      </div>
      <Button
        onPress={() => setUser({ darkMode: !isDarkMode })}
        color="primary"
        variant="light"
        // isIconOnly
        // radius="full"
        className={""}
      >
        {!isDarkMode ? (
          <MoonIcon className="h-auto w-5" />
        ) : (
          <SunIcon className="h-auto w-5" />
        )}
        {isDarkMode ? "Dark" : "Light"} mode
      </Button>
      <EditUserModal isOpen={isOpen} onClose={onClose} />
    </aside>
  );
};
