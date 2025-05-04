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
import { formatBtwNumber, formatIban, validationCity } from "src/helpers";

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
            rules={{ required: "Required" }}
            render={({ field }) => (
              <Input
                label="Business Name"
                {...field}
                isInvalid={!!errors.name}
                errorMessage={errors.name?.message}
              />
            )}
          />
          <Controller
            name="street"
            control={control}
            rules={{ required: "Required" }}
            render={({ field }) => (
              <Input
                label="Street"
                {...field}
                isInvalid={!!errors.street}
                errorMessage={errors.street?.message}
              />
            )}
          />
          <Controller
            name="houseNumber"
            control={control}
            rules={{ required: "Required" }}
            render={({ field }) => (
              <Input
                label="House Number"
                {...field}
                isInvalid={!!errors.houseNumber}
                errorMessage={errors.houseNumber?.message}
              />
            )}
          />
          <Controller
            name="city"
            control={control}
            rules={{
              required: "Required",
              validate: validationCity.validate,
            }}
            render={({ field }) => (
              <Input
                {...field}
                label="Postal code, City name (9000, Gent)"
                onChange={field.onChange}
                onBlur={validationCity.onBlur(field.onChange)}
                isInvalid={!!errors.city}
                errorMessage={errors.city?.message}
              />
            )}
          />
          <Controller
            name="country"
            control={control}
            rules={{ required: "Required" }}
            render={({ field }) => (
              <Input
                label="Country"
                {...field}
                isInvalid={!!errors.country}
                errorMessage={errors.country?.message}
              />
            )}
          />
          <Controller
            name="btw"
            control={control}
            rules={{
              required: "Required",
            }}
            render={({ field }) => (
              <Input
                label="BTW Number"
                {...field}
                onBlur={() => field.onChange(formatBtwNumber(field.value))}
                isInvalid={!!errors.btw}
                errorMessage={errors.btw?.message}
              />
            )}
          />
          <Controller
            name="iban"
            control={control}
            rules={{
              required: "Required",
            }}
            render={({ field }) => (
              <Input
                {...field}
                label="IBAN"
                onBlur={() => field.onChange(formatIban(field.value))}
                isInvalid={!!errors.iban}
                errorMessage={errors.iban?.message}
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
