import { useState, useCallback } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import { MagnifyingGlassIcon, PlusIcon } from "@heroicons/react/20/solid";
import { useContactsStore, useContacts } from "../store/contactsStore";

export const ContactsPage = () => {
  const {
    isOpen: isAddOpen,
    onOpen: onAddOpen,
    onClose: onAddClose,
  } = useDisclosure();
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const contacts = useContacts();

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.address.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditClick = useCallback(
    (contact: Contact) => {
      setSelectedContact(contact);
      onEditOpen();
    },
    [onEditOpen]
  );

  const handleDeleteClick = useCallback(
    (contact: Contact) => {
      setSelectedContact(contact);
      onDeleteOpen();
    },
    [onDeleteOpen]
  );

  return (
    <div className="flex w-full flex-col p-5">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Contacts</h1>
        <Button
          color="primary"
          startContent={<PlusIcon className="h-5 w-5" />}
          onPress={onAddOpen}
        >
          Add Contact
        </Button>
      </div>

      <Input
        placeholder="Search contacts"
        startContent={<MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-5 max-w-md"
      />

      <Table aria-label="Contacts table with sorting" className="w-full">
        <TableHeader>
          <TableColumn key="name" allowsSorting>
            Business Name
          </TableColumn>
          <TableColumn key="city" allowsSorting>
            City
          </TableColumn>
          <TableColumn key="btw">BTW Number</TableColumn>
          <TableColumn key="actions">Actions</TableColumn>
        </TableHeader>
        <TableBody items={filteredContacts}>
          {(contact) => (
            <TableRow key={contact.id}>
              <TableCell>{contact.name}</TableCell>
              <TableCell>{contact.address.city}</TableCell>
              <TableCell>{contact.btw}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onPress={() => handleEditClick(contact)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    color="danger"
                    onPress={() => handleDeleteClick(contact)}
                  >
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Modal isOpen={isAddOpen} onOpenChange={onAddClose} backdrop="blur">
        <ModalContent>
          <UpdateContactModal contact={null} onClose={onAddClose} />
        </ModalContent>
      </Modal>

      <Modal isOpen={isEditOpen} onOpenChange={onEditClose} backdrop="blur">
        <ModalContent>
          {selectedContact && (
            <UpdateContactModal
              contact={selectedContact}
              onClose={onEditClose}
            />
          )}
        </ModalContent>
      </Modal>

      <Modal isOpen={isDeleteOpen} onOpenChange={onDeleteClose} backdrop="blur">
        <ModalContent>
          {selectedContact && (
            <DeleteContactModal
              contact={selectedContact}
              onCancel={onDeleteClose}
              onDelete={() => {
                useContactsStore.getState().deleteContact(selectedContact.id);
                onDeleteClose();
              }}
            />
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

const UpdateContactModal = ({
  contact,
  onClose,
}: {
  contact: Contact | null;
  onClose: () => void;
}) => {
  const { addContact, updateContact } = useContactsStore();
  const [name, setName] = useState(contact?.name || "");
  const [street, setStreet] = useState(contact?.address?.street || "");
  const [houseNumber, setHouseNumber] = useState(
    contact?.address?.houseNumber || ""
  );
  const [city, setCity] = useState(contact?.address?.city || "");
  const [country, setCountry] = useState(contact?.address?.country || "");
  const [btw, setBtw] = useState(contact?.btw || "");

  const handleSave = useCallback(() => {
    const newContact: Contact = {
      id: contact?.id || Date.now().toString(),
      name,
      address: { street, houseNumber, city, country },
      btw,
    };
    contact ? updateContact(newContact) : addContact(newContact);
    onClose();
  }, [
    name,
    street,
    houseNumber,
    city,
    country,
    btw,
    contact,
    addContact,
    updateContact,
    onClose,
  ]);

  return (
    <>
      <ModalHeader>{contact ? "Edit Contact" : "Add Contact"}</ModalHeader>
      <ModalBody>
        <div className="grid gap-4">
          <Input
            label="Business Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Street"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
          />
          <Input
            label="House Number"
            value={houseNumber}
            onChange={(e) => setHouseNumber(e.target.value)}
          />
          <Input
            label="Postal code, City name (eg. 9000, Gent)"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <Input
            label="Country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />
          <Input
            label="BTW Number"
            value={btw}
            onChange={(e) => setBtw(e.target.value)}
          />
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onPress={onClose}>
          Cancel
        </Button>
        <Button variant="solid" color="primary" onPress={handleSave}>
          {contact ? "Update" : "Create"}
        </Button>
      </ModalFooter>
    </>
  );
};

const DeleteContactModal = ({
  contact,
  onCancel,
  onDelete,
}: {
  contact: Contact;
  onCancel: () => void;
  onDelete: () => void;
}) => {
  return (
    <>
      <ModalHeader>Confirm Delete</ModalHeader>
      <ModalBody>
        <p>Are you sure you want to delete "{contact.name}"?</p>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onPress={onCancel}>
          Cancel
        </Button>
        <Button variant="solid" color="danger" onPress={onDelete}>
          Delete
        </Button>
      </ModalFooter>
    </>
  );
};
