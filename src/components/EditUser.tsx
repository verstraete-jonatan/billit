import React from "react";
import { useForm, Controller } from "react-hook-form";
import { Modal, ModalContent, Input, Button } from "@heroui/react";
import { useUserStore } from "../store/userStore";
import { formatBtwNumber, structuredMessage } from "src/validation";

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type UserForm = {
  name: string;
  address: {
    street: string;
    houseNumber: string;
    city: string;
    country: string;
  };
  btw: string;
  email: string;
  iban: string;
  structuredMessage: string;
  voorWaardedenUrl: string;
  logo: string | null;
};

export const EditUserModal = ({ isOpen, onClose }: EditUserModalProps) => {
  const { user, setUser } = useUserStore();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UserForm>({
    mode: "onChange",
    defaultValues: {
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
      structuredMessage: user?.structuredMessage || "",
      voorWaardedenUrl: user?.voorWaardedenUrl || "",
      logo: user?.logo || null,
    },
  });

  const logo = watch("logo");

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setValue("logo", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data: UserForm) => {
    setUser({
      id: "me",
      name: data.name,
      address: data.address,
      btw: data.btw,
      email: data.email,
      iban: data.iban,
      logo: data.logo || "",
      voorWaardedenUrl: data.voorWaardedenUrl,
      structuredMessage: data.structuredMessage,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalContent>
        <div className="bg-[#1A1A1A] text-white py-8 px-4 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-center">Edit my info</h2>
          <div className=" space-y-1 grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Business Name */}
            <Controller
              name="name"
              control={control}
              rules={{ required: "Bedrijfsnaam is verplicht" }}
              render={({ field }) => (
                <Input
                  label="Bedrijfsnaam"
                  value={field.value}
                  onChange={field.onChange}
                  className="bg-[#2A2A2A] border-gray-600 focus:border-gradient-to-r focus:border-[#4A4A4A] rounded-lg"
                  isInvalid={!!errors.name}
                  errorMessage={errors.name?.message}
                />
              )}
            />

            {/* Email */}
            <Controller
              name="email"
              control={control}
              rules={{
                required: "is required",
                validate: validateEmail,
              }}
              render={({ field }) => (
                <Input
                  label="E-mail"
                  type="email"
                  value={field.value}
                  onChange={field.onChange}
                  className="bg-[#2A2A2A] border-gray-600 focus:border-gradient-to-r focus:border-[#4A4A4A] rounded-lg"
                  isInvalid={!!errors.email}
                  errorMessage={errors.email?.message}
                />
              )}
            />

            {/* Street */}
            <Controller
              name="address.street"
              control={control}
              rules={{ required: "Straat is verplicht" }}
              render={({ field }) => (
                <Input
                  label="Straat"
                  value={field.value}
                  onChange={field.onChange}
                  className="bg-[#2A2A2A] border-gray-600 focus:border-gradient-to-r focus:border-[#4A4A4A] rounded-lg"
                  isInvalid={!!errors.address?.street}
                  errorMessage={errors.address?.street?.message}
                />
              )}
            />

            {/* House Number */}
            <Controller
              name="address.houseNumber"
              control={control}
              rules={{ required: "Huisnummer is verplicht" }}
              render={({ field }) => (
                <Input
                  label="Huisnummer"
                  value={field.value}
                  onChange={field.onChange}
                  className="bg-[#2A2A2A] border-gray-600 focus:border-gradient-to-r focus:border-[#4A4A4A] rounded-lg"
                  isInvalid={!!errors.address?.houseNumber}
                  errorMessage={errors.address?.houseNumber?.message}
                />
              )}
            />

            {/* City */}
            <Controller
              name="address.city"
              control={control}
              rules={{ required: "Stad is verplicht" }}
              render={({ field }) => (
                <Input
                  label="Postcode, Stad (bijv. 9000, Gent)"
                  value={field.value}
                  onChange={field.onChange}
                  className="bg-[#2A2A2A] border-gray-600 focus:border-gradient-to-r focus:border-[#4A4A4A] rounded-lg"
                  isInvalid={!!errors.address?.city}
                  errorMessage={errors.address?.city?.message}
                />
              )}
            />

            {/* Country */}
            <Controller
              name="address.country"
              control={control}
              rules={{ required: "Land is verplicht" }}
              render={({ field }) => (
                <Input
                  label="Land"
                  value={field.value}
                  onChange={field.onChange}
                  className="bg-[#2A2A2A] border-gray-600 focus:border-gradient-to-r focus:border-[#4A4A4A] rounded-lg"
                  isInvalid={!!errors.address?.country}
                  errorMessage={errors.address?.country?.message}
                />
              )}
            />

            {/* BTW Number */}
            <Controller
              name="btw"
              control={control}
              rules={{
                required: "is required",
                validate: validateBtw,
              }}
              render={({ field }) => (
                <Input
                  label="BTW-nummer"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={(e) => {
                    e.target.value = formatBtwNumber(field.value);
                    field.onChange(e);
                  }}
                  className="bg-[#2A2A2A] border-gray-600 focus:border-gradient-to-r focus:border-[#4A4A4A] rounded-lg"
                  isInvalid={!!errors.btw}
                  errorMessage={errors.btw?.message}
                />
              )}
            />

            {/* IBAN */}
            <Controller
              name="iban"
              control={control}
              rules={{
                required: "is required",
              }}
              render={({ field }) => (
                <Input
                  label="IBAN"
                  value={field.value}
                  onChange={field.onChange}
                  className="bg-[#2A2A2A] border-gray-600 focus:border-gradient-to-r focus:border-[#4A4A4A] rounded-lg"
                  isInvalid={!!errors.iban}
                  errorMessage={errors.iban?.message}
                />
              )}
            />

            {/* Structured Message */}
            <Controller
              name="structuredMessage"
              control={control}
              rules={{
                required: "is required",
                validate: structuredMessage.validate,
              }}
              render={({ field }) => (
                <Input
                  label="Gestuctureerde mededeling"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={structuredMessage.onBlur(field.onChange)}
                  className="bg-[#2A2A2A] border-gray-600 focus:border-gradient-to-r focus:border-[#4A4A4A] rounded-lg"
                  isInvalid={!!errors.structuredMessage}
                  errorMessage={errors.structuredMessage?.message}
                />
              )}
            />

            {/* Voorwaarden URL */}
            <Controller
              rules={{ required: "is required" }}
              name="voorWaardedenUrl"
              control={control}
              render={({ field }) => (
                <Input
                  label="URL algemene voorwaarden (https://x.com)"
                  value={field.value}
                  onChange={field.onChange}
                  className="bg-[#2A2A2A] border-gray-600 focus:border-gradient-to-r focus:border-[#4A4A4A] rounded-lg"
                />
              )}
            />
          </div>

          {/* Logo Upload */}
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-400">Logo</label>
            <input
              type="file"
              accept="image/png"
              onChange={handleLogoChange}
              className="bg-[#2A2A2A] text-white border-gray-600 p-2 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-700 file:text-white hover:file:bg-gray-600"
            />
            {logo && (
              <img
                src={logo}
                alt="Logo Preview"
                className="h-16 w-16 object-contain mt-2 rounded-lg border border-gray-600"
              />
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <Button
              onPress={onClose}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-gray-600 transition-all"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onPress={() => handleSubmit(onSubmit)()}
              className="bg-gradient-to-r from-gray-200 to-white text-black px-4 py-2 rounded-lg shadow-sm hover:from-gray-300 hover:to-gray-100 transition-all"
            >
              Save
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const btwRegex = /^([A-Z]{2})[0-9]{2} [0-9]{6}/;
// Allow formats like +++123/4567/89012+++ (Belgium) or ++12/3456/78901++ (other countries), or raw 12-digit number
const structuredMessageRegex =
  /^((\+{2,3}\d{2,3}\/\d{4}\/\d{5}\+{2,3})|\d{12})$/;

// Validation functions
const validateBtw = (value: string) => {
  return true;
  return btwRegex.test(value) || "Ongeldig BTW-nummer (bijv. BE0123.456.789)";
};

const validateStructuredMessage = (value: string) =>
  isNaN(Number(value.replaceAll(" ", ""))) ||
  "Only use numbers and spaces. Adding things like + or / are done later";

const validateEmail = (value: string) => {
  return emailRegex.test(value) || "invalid email";
};
