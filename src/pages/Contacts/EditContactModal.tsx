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
type ContactForm = Omit<Contact, "address"> & Contact["address"];

export const EditContactModal = ({
  contact,
  onClose,
}: {
  contact: Contact | null;
  onClose: () => void;
}) => {
  const { addContact, updateContact, contacts } = useContactsStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactForm>({
    defaultValues: {
      email: contact?.email ?? "",
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
        email: data.email,
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

  const validateUniqueEmail = (n?: string): string | true => {
    if (contacts.find(({ email }) => email === n)) {
      return "Email already in use, try another (can be anything really).";
    }

    return true;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="text-white bg_modal">
      <ModalHeader>{contact ? "Edit Contact" : "Add Contact"}</ModalHeader>
      <ModalBody className="p-6">
        <div className="grid gap-4">
          <Controller
            name="email"
            control={control}
            rules={{ required: "Required", validate: validateUniqueEmail }}
            render={({ field }) => (
              <Input
                label="Email (unique)"
                {...field}
                isInvalid={!!errors.email}
                errorMessage={errors.email?.message}
              />
            )}
          />
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
                label="City: postal code AND City name 'eg. 9000, Gent'"
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
