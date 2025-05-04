import { Link, useLocation } from "react-router-dom";

import { useCallback, useState } from "react";
import { useUserStore } from "../store/userStore";
import {
  Button,
  Input,
  Modal,
  ModalContent,
  useDisclosure,
} from "@heroui/react"; // Assuming HeroUI components
import { EditUserModal } from "./EditUser";
import { formatBtwNumber } from "src/helpers";
import { navItems } from "src/Router";

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
      <hr className="flex-1 w-2/3" />
      <div className="p-6 border-t border-gray-700">
        <Button onPress={onOpen} color="primary" variant="light">
          Edit my Info
        </Button>
      </div>
      <EditUserModal isOpen={isOpen} onClose={onClose} />
    </aside>
  );
};

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const _EditUserModal = ({ isOpen, onClose }: EditUserModalProps) => {
  const { user, setUser } = useUserStore();
  const [formData, setFormData] = useState<User>({
    name: user?.name || "",
    address: {
      street: user?.address.street || "",
      houseNumber: user?.address.houseNumber || "",
      city: user?.address.city || "",
      country: user?.address.country || "",
    },
    btw: user?.btw || "",
    email: user?.email || "",
    iban: user?.iban || "",
    logo: user?.logo || "",
    voorwaardedenUrl: user?.voorwaardedenUrl ?? "",
    structuredMessage: user?.structuredMessage ?? "",
    settings: user?.settings ?? {},
    id: "me",
  });

  const handleInputChange = useCallback((field: keyof User, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleAddressChange = useCallback((field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
  }, []);

  const handleLogoChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData((prev) => ({
            ...prev,
            logo: reader.result as string,
          }));
        };
        reader.readAsDataURL(file);
      }
    },
    []
  );

  const handleSubmit = useCallback(() => {
    setUser({
      name: formData.name,
      address: formData.address,
      btw: formData.btw,
      email: formData.email,
      iban: formData.iban,
      logo: formData.logo || "",
      voorwaardedenUrl: formData.voorwaardedenUrl,
      structuredMessage: formData.structuredMessage,
      settings: formData.settings,
      id: "me",
    });
    onClose();
  }, [formData, setUser, onClose]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit User Info">
      <ModalContent>
        <div className="bg-[#222] text-white">
          <div className="max-h-[80vh] overflow-y-auto flex flex-col gap-4 p-8">
            <p>
              Details will appear on each bill. You can still customize the
              bill.
            </p>
            <Input
              label="Business Name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              required
            />
            <Input
              label="Street"
              value={formData.address.street}
              onChange={(e) => handleAddressChange("street", e.target.value)}
              required
            />
            <Input
              label="House Number"
              value={formData.address.houseNumber}
              onChange={(e) =>
                handleAddressChange("houseNumber", e.target.value)
              }
              required
            />
            <Input
              label="Postal code, City name (eg. 9000, Gent)"
              value={formData.address.city}
              onChange={(e) => handleAddressChange("city", e.target.value)}
              required
            />
            <Input
              label="Country"
              value={formData.address.country}
              onChange={(e) => handleAddressChange("country", e.target.value)}
              required
            />
            <Input
              label="BTW Number"
              value={formData.btw}
              onBlur={() =>
                handleInputChange("btw", formatBtwNumber(formData.btw))
              }
              onChange={(e) => handleInputChange("btw", e.target.value)}
              required
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              required
            />
            <Input
              label="IBAN"
              value={formData.iban}
              onChange={(e) => handleInputChange("iban", e.target.value)}
              required
            />
            <Input
              label="Structured message (remittance)"
              value={formData.structuredMessage}
              onChange={(e) =>
                handleInputChange("structuredMessage", e.target.value)
              }
              required
            />
            <Input
              label="Url algemene voorwaarden"
              value={formData.voorwaardedenUrl}
              onChange={(e) =>
                handleInputChange("voorwaardedenUrl", e.target.value)
              }
              required
            />
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-400">Logo</label>
              <input
                type="file"
                accept="image/png"
                onChange={handleLogoChange}
                className="bg-gray-800 text-white border-gray-600 p-2 rounded"
              />
              {formData.logo && (
                <img
                  src={formData.logo}
                  alt="Logo Preview"
                  className="h-16 w-16 object-contain mt-2"
                />
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              onPress={onClose}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
            >
              Cancel
            </Button>
            <Button
              onPress={handleSubmit}
              className="bg-white text-black hover:bg-gray-200 px-4 py-2 rounded"
              disabled={
                !formData.name ||
                !formData.address.street ||
                !formData.address.houseNumber ||
                !formData.address.city ||
                !formData.address.country ||
                !formData.btw ||
                !formData.email ||
                !formData.iban
              }
            >
              Save
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
};
