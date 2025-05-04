import { useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
} from "@heroui/react";
import { useContactsStore } from "../../store/contactsStore";
import { formatBtwNumber, formatIban } from "src/helpers";

// Form type for the contact
type ContactForm = {
  name: string;
  street: string;
  houseNumber: string;
  city: string;
  country: string;
  btw: string;
  iban: string;
};

export const EditContactModal = ({
  contact,
  onClose,
}: {
  contact: Contact | null;
  onClose: () => void;
}) => {
  const { addContact, updateContact } = useContactsStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactForm>({
    defaultValues: {
      name: contact?.name || "",
      street: contact?.address?.street || "",
      houseNumber: contact?.address?.houseNumber || "",
      city: contact?.address?.city || "",
      country: contact?.address?.country || "",
      btw: contact?.btw || "",
      iban: contact?.iban || "",
    },
    mode: "onChange",
  });

  const onSubmit = useCallback(
    (data: ContactForm) => {
      const formattedData: Contact = {
        id: contact?.id || Date.now().toString(),
        name: data.name,
        iban: formatIban(data.iban),
        address: {
          street: data.street,
          houseNumber: data.houseNumber,
          city: data.city,
          country: data.country,
        },
        btw: formatBtwNumber(data.btw),
      };
      contact ? updateContact(formattedData) : addContact(formattedData);
      onClose();
    },
    [contact, addContact, updateContact, onClose]
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="text-white bg_modal">
      <ModalHeader>{contact ? "Edit Contact" : "Add Contact"}</ModalHeader>
      <ModalBody className="p-6">
        <div className="grid gap-4">
          <Controller
            name="name"
            control={control}
            rules={{ required: "Business name is required" }}
            render={({ field }) => (
              <Input
                label="Business Name"
                {...field}
                isInvalid={!!errors.name}
                errorMessage={errors.name?.message}
                className="bg-white text-black border-gray-300 rounded-md"
              />
            )}
          />
          <Controller
            name="street"
            control={control}
            rules={{ required: "Street is required" }}
            render={({ field }) => (
              <Input
                label="Street"
                {...field}
                isInvalid={!!errors.street}
                errorMessage={errors.street?.message}
                className="bg-white text-black border-gray-300 rounded-md"
              />
            )}
          />
          <Controller
            name="houseNumber"
            control={control}
            rules={{ required: "House number is required" }}
            render={({ field }) => (
              <Input
                label="House Number"
                {...field}
                isInvalid={!!errors.houseNumber}
                errorMessage={errors.houseNumber?.message}
                className="bg-white text-black border-gray-300 rounded-md"
              />
            )}
          />
          <Controller
            name="city"
            control={control}
            rules={{
              required: "City is required",
              pattern: {
                value: /^\d{4},\s*[A-Za-z\s]+$/,
                message:
                  "Format must be 'Postal code, City name' (e.g., 9000, Gent)",
              },
            }}
            render={({ field }) => (
              <Input
                label="Postal code, City name (e.g., 9000, Gent)"
                {...field}
                isInvalid={!!errors.city}
                errorMessage={errors.city?.message}
                className="bg-white text-black border-gray-300 rounded-md"
              />
            )}
          />
          <Controller
            name="country"
            control={control}
            rules={{ required: "Country is required" }}
            render={({ field }) => (
              <Input
                label="Country"
                {...field}
                isInvalid={!!errors.country}
                errorMessage={errors.country?.message}
                className="bg-white text-black border-gray-300 rounded-md"
              />
            )}
          />
          <Controller
            name="btw"
            control={control}
            rules={{
              required: "BTW number is required",
              validate: (value) => {
                const formatted = formatBtwNumber(value);
                return formatted === value ? true : "Invalid BTW format";
              },
            }}
            render={({ field }) => (
              <Input
                label="BTW Number"
                {...field}
                onBlur={() => field.onChange(formatBtwNumber(field.value))}
                isInvalid={!!errors.btw}
                errorMessage={errors.btw?.message}
                className="bg-white text-black border-gray-300 rounded-md"
              />
            )}
          />
          <Controller
            name="iban"
            control={control}
            rules={{
              required: "IBAN is required",
              validate: (value) => {
                const formatted = formatIban(value);
                return formatted === value ? true : "Invalid IBAN format";
              },
            }}
            render={({ field }) => (
              <Input
                label="IBAN"
                {...field}
                onBlur={() => field.onChange(formatIban(field.value))}
                isInvalid={!!errors.iban}
                errorMessage={errors.iban?.message}
                className="bg-white text-black border-gray-300 rounded-md"
              />
            )}
          />
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onPress={onClose} className="text-white">
          Cancel
        </Button>
        <Button type="submit" variant="solid" color="primary">
          {contact ? "Update" : "Create"}
        </Button>
      </ModalFooter>
    </form>
  );
};
