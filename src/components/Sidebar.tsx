import { Link, useLocation } from "react-router-dom";

import { Button, useDisclosure } from "@heroui/react"; // Assuming HeroUI components
import { EditUserModal } from "./EditUserModal";

import { navItems } from "src/Router";
import { EyeIcon } from "@heroicons/react/24/outline";

export const Sidebar = () => {
  const location = useLocation();
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <aside className="w-64 bg-[#0A0A0A] text-white h-full flex flex-col border-r border-gray-700">
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
          const isActive = location.pathname.startsWith(item.path);
          return (
            <div key={item.name} className="list-none flex flex-col mb-5">
              <Link
                to={item.path}
                className={`flex items-center mx-4 px-4 py-3 rounded-lg transition-all duration-300 ${
                  isActive
                    ? "bg-gray-200 text-black font-semibold"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <item.icon className="h-5 w-5 mr-3 opacity-80" />
                {item.name}
              </Link>
            </div>
          );
        })}
      </nav>

      <nav className="ml-5 mt-3 flex-1 text-[#aaa]">
        Customization
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
            <EyeIcon className="h-5 w-5 inline" /> Invert
          </Button>
        </div>
      </div>
      <div className="p-6 border-t border-gray-700">
        <Button onPress={onOpen} color="primary" variant="light">
          Edit my Info
        </Button>
      </div>
      <EditUserModal isOpen={isOpen} onClose={onClose} />
    </aside>
  );
};
