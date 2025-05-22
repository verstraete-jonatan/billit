/// <reference types="vite/client" />

import { QRCode } from "react-qrcode-logo";

declare global {
  type Address = {
    street: string;
    houseNumber: string;
    city: string;
    country: string;
  };

  interface Contact {
    id: string;
    name: string;
    address: Address;
    btw: string;
    iban: string;
    email?: string;
  }

  interface User extends Contact {
    logo: string; // Base64 string for the logo image

    voorwaardedenUrl: string;
    structuredMessage: string;

    darkMode?: boolean;
  }

  type BillStatus = "DRAFT" | "PENDING" | "PAYED";

  type Bill = {
    user: User;
    contact: Contact;
    status: BillStatus;
    expirationDate: string;
    billingNumber: string;
    id: string;
    assignments: Assignment[];
    structuredMessage?: string;
  };

  interface Assignment {
    description: string;
    startDate: string;
    endDate: string;
    quantity: number;
    // anything
    unit?: string;
    // price per unit
    unitPrice: number;
    btw: 6 | 12 | 21;
  }

  type QrCodeSettings = QRCode["props"] & { enableLogo: boolean };

  type BillForm = {
    contactId: string;
    expirationDate: string;
    billingNumber: string;
    structuredMessage: string;
    assignments: Assignment[];
  };

  type Defined<A> = A extends null | undefined ? never : A;
}
export {};
