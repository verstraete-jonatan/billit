import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { dummy_contacts } from "./_dummy";

interface ContactsState {
  contacts: Contact[];
  loading: boolean;
  addContact: (contact: Contact) => void;
  updateContact: (contact: Contact) => void;
  deleteContact: (id: string) => void;
}

const sorted = (contacts: Contact[]) =>
  [...contacts].sort((a, b) => a.name.localeCompare(b.name));

export const useContactsStore = create<ContactsState>()(
  persist(
    (set, get) => ({
      contacts: dummy_contacts ?? [],
      loading: false,
      addContact: (contact) => {
        set((state) => ({ contacts: [...state.contacts, contact] }));
      },
      updateContact: (updatedContact) => {
        set((state) => ({
          contacts: sorted(
            state.contacts.map((contact) =>
              contact.id === updatedContact.id ? updatedContact : contact
            )
          ),
        }));
      },
      deleteContact: (id) => {
        set((state) => ({
          contacts: state.contacts.filter((contact) => contact.id !== id),
        }));
      },
    }),
    {
      name: "contacts-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export const useContacts = (): Contact[] =>
  useContactsStore(({ contacts }) => contacts);
