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
    logo: string;
    voorWaardedenUrl: string;
    structuredMessage: string;
  }

  export type BillStatus = "DRAFT" | "PENDING" | "PAYED";

  export type Bill = {
    user: User;
    contact: Contact;
    status: BillStatus;
    expirationDate: string;
    billingNumber: string;
    id: string;
    assignments: Assignment[];
    structuredMessage?: string;
  };

  export interface Assignment {
    description: string;
    startDate: string;
    endDate: string;
    quantity: number;
    unitPrice: number;
    btw: 6 | 12 | 21;
  }

  export type User = {
    name: string;
    address: Address;
    btwNumber: string;
    email: string;
    iban: string;
    logo: string | null; // Base64 string for the logo image
  };

  export type QrCodeSettings = QRCode["props"] & { enableLogo?: boolean };

  type Defined<A> = A extends UnDef ? never : A;
}
export {};
