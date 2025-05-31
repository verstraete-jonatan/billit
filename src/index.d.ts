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
    assignments: Assignment[];
    billingNumber: string;
    contact: Contact;
    date: string;
    expirationDate: string;
    id: string;
    status: BillStatus;
    structuredMessage?: string;
    user: User;
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

  type BillForm = PartialWithUndefined<Bill>;

  type Defined<A> = A extends null | undefined ? never : A;

  type PartialWithUndefined<T> = {
    [K in keyof T]: T[K] | undefined;
  };
}
export {};
