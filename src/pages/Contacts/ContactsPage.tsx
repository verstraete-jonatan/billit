import { useState, useCallback, useMemo } from "react";
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
import { useContactsStore, useContacts } from "../../store/contactsStore";
import { formatBtwNumber, formatIban } from "src/helpers";
import { EditContactModal } from "./EditContactModal";

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

  const contactSearchIndexes = useMemo(
    () =>
      Object.fromEntries(
        contacts.map((contact) => [
          contact.id,
          Object.values(contact).join("").toLowerCase(),
        ])
      ),
    [contacts]
  );

  const filteredContacts = useMemo(
    () =>
      contacts.filter(({ id }) =>
        contactSearchIndexes[id]?.includes(searchTerm)
      ),
    [contacts, contactSearchIndexes, searchTerm]
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
      <div className="mb-5 flex items-center justify-between px-6 py-4">
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
          <TableColumn key="iban">IBAN</TableColumn>
          <TableColumn key="actions">Actions</TableColumn>
        </TableHeader>
        <TableBody items={filteredContacts}>
          {(contact) => (
            <TableRow key={contact.id}>
              <TableCell>{contact.name}</TableCell>
              <TableCell>{contact.address.city}</TableCell>
              <TableCell>{contact.btw}</TableCell>
              <TableCell>{contact.iban}</TableCell>
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

      <Modal
        isOpen={isAddOpen}
        onOpenChange={onAddClose}
        backdrop="blur"
        className="bg_modal"
      >
        <ModalContent>
          <EditContactModal contact={null} onClose={onAddClose} />
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isEditOpen}
        onOpenChange={onEditClose}
        backdrop="blur"
        className="bg_modal"
      >
        <ModalContent>
          {selectedContact && (
            <EditContactModal contact={selectedContact} onClose={onEditClose} />
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
