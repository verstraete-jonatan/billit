import React from "react";
import { useForm, Controller } from "react-hook-form";
import { Modal, ModalContent, Input, Button } from "@heroui/react";
import { useUserStore } from "../store/userStore";
import {
  formatBtwNumber,
  validationCity,
  validationMessage,
} from "src/helpers";

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditUserModal = ({ isOpen, onClose }: EditUserModalProps) => {
  const { user, setUser } = useUserStore();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<User>({
    mode: "onChange",
    defaultValues: {
      ...user,
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

  const onSubmit = (data: User) => {
    setUser({ ...user, ...data });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalContent>
        <div className="bg_modal text-white py-8 px-4 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-center">Edit my info</h2>
          <div className=" space-y-1 grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Business Name */}
            <Controller
              name="name"
              control={control}
              rules={{ required: "Required" }}
              render={({ field }) => (
                <Input
                  label="Bedrijfsnaam"
                  value={field.value}
                  onChange={field.onChange}
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
                required: "Required",
                validate: validateEmail,
              }}
              render={({ field }) => (
                <Input
                  label="E-mail"
                  type="email"
                  value={field.value}
                  onChange={field.onChange}
                  isInvalid={!!errors.email}
                  errorMessage={errors.email?.message}
                />
              )}
            />

            {/* Street */}
            <Controller
              name="address.street"
              control={control}
              rules={{ required: "Required" }}
              render={({ field }) => (
                <Input
                  label="Straat"
                  value={field.value}
                  onChange={field.onChange}
                  isInvalid={!!errors.address?.street}
                  errorMessage={errors.address?.street?.message}
                />
              )}
            />

            {/* House Number */}
            <Controller
              name="address.houseNumber"
              control={control}
              rules={{ required: "Required" }}
              render={({ field }) => (
                <Input
                  {...field}
                  type="number"
                  label="Huisnummer"
                  isInvalid={!!errors.address?.houseNumber}
                  errorMessage={errors.address?.houseNumber?.message}
                />
              )}
            />

            {/* City */}
            <Controller
              name="address.city"
              control={control}
              rules={{
                required: "Required",
                validate: validationCity.validate,
              }}
              render={({ field }) => (
                <Input
                  {...field}
                  label="Postcode, Stad (bijv. 9000, Gent)"
                  onBlur={validationCity.onBlur(field.onChange)}
                  isInvalid={!!errors.address?.city}
                  errorMessage={errors.address?.city?.message}
                />
              )}
            />

            {/* Country */}
            <Controller
              name="address.country"
              control={control}
              rules={{ required: "Required" }}
              render={({ field }) => (
                <Input
                  label="Land"
                  value={field.value}
                  onChange={field.onChange}
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
                required: "Required",
                validate: validateBtw,
              }}
              render={({ field }) => (
                <Input
                  label="BTW-nummer"
                  value={field.value}
                  onChange={field.onChange}
                  // onBlur={(e) => {
                  //   e.target.value = formatBtwNumber(field.value);
                  //   field.onChange(e);
                  // }}

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
                required: "Required",
              }}
              render={({ field }) => (
                <Input
                  label="IBAN"
                  value={field.value}
                  onChange={field.onChange}
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
                required: "Required",
                validate: validationMessage.validate,
              }}
              render={({ field }) => (
                <Input
                  label="Gestuctureerde mededeling"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={validationMessage.onBlur(field.onChange)}
                  isInvalid={!!errors.structuredMessage}
                  errorMessage={errors.structuredMessage?.message}
                />
              )}
            />

            {/* Voorwaarden URL */}
            <Controller
              rules={{ required: "Required" }}
              name="voorwaardedenUrl"
              control={control}
              render={({ field }) => (
                <Input
                  label="URL algemene voorwaarden (https://x.com)"
                  value={field.value}
                  onChange={field.onChange}
                  isInvalid={!!errors.voorwaardedenUrl}
                  errorMessage={errors.voorwaardedenUrl?.message}
                />
              )}
            />
          </div>

          {/* Logo Upload */}
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-400">Logo</label>
            <input type="file" accept="image/png" onChange={handleLogoChange} />
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

// Validation functions
const validateBtw = (value: string) => {
  return true;
  return btwRegex.test(value) || "Ongeldig BTW-nummer (bijv. BE0123.456.789)";
};

const validateEmail = (value?: string) => {
  return (value && emailRegex.test(value)) || "invalid email";
};
