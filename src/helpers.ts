import { isValid as isIbanValid, toBBAN, printFormat } from "iban-ts";
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router";

// type Fn = {
//   validate: (i: string)=> boolean | string | void
//   onBlur: (onChange: (value: string) => void) =>
//     (event: React.ChangeEvent<HTMLInputElement>) => void
// }
export const validationMessage: ValidationItem = {
  validate: (input: string) => {
    if (!/^[\d\+\/]+$/.test(input)) {
      return "invalid characters (only 0-9, +, or / allowed)";
    }
    const digits = input.replace(/[^\d]/g, "");
    if (digits.length !== 12) {
      return `Must be 12 numbers (now: ${digits.length}).`;
    }
    return true;
  },

  onBlur:
    (onChange: (value: React.ChangeEvent<HTMLInputElement>) => void) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      let value = event.target.value.replace(/[^\d]/g, "");

      if (value.length === 12) {
        // Format as +++XXX/XXXX/XXXXX+++
        value = `${value.slice(0, 3)}/${value.slice(3, 7)}/${value.slice(7)}`;
        value = `+++${value}+++`;
      }

      event.target.value = value;
      onChange(event);
    },
};

export const validationCity: ValidationItem = {
  validate: (input: string) => {
    // Regex: one or more digits, optional spaces, a comma, optional spaces, one or more letters
    if (!/^\d+\s*,\s*[a-zA-Z]+$/.test(input)) {
      return "Invalid format (eg. 9000, Gent)";
    }
    // Optional: Add specific validation, e.g., max length of digits or letters
    const digits = input.match(/^\d+/)?.[0] || "";
    const letters = input.match(/[a-zA-Z]+$/)?.[0] || "";
    if (digits.length !== 4) {
      return "Missing postal code";
    }
    if (!letters.length) {
      return `Missing city name`;
    }
    return true;
  },

  onBlur:
    (onChange: (value: React.ChangeEvent<HTMLInputElement>) => void) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      let value = event.target.value.trim(); // Remove leading/trailing spaces

      // Extract digits and letters, ignoring spaces and comma
      const match = value.match(/(\d+)\s*,\s*([a-zA-Z]+)/);
      if (match) {
        const digits = match[1];
        const letters = match[2];
        // Format as "digits,letters" (no spaces around comma)
        value = `${digits}, ${letters}`;
      } else {
        // If invalid, keep the input as-is or clear it (depending on your preference)
        value = "";
      }
      event.target.value = value;
      onChange(event);
    },
};

export const formatIban = (iban: string) => {
  return printFormat(iban);
  const [country] = iban.split(/\d+/);
  return `${country.replaceAll(" ", "")} ${iban.replace(
    /\D/g,
    ""
  )}`.toUpperCase();
};

export const formatBtwNumber = (btw: string) => {
  return btw || "";
  btw = btw.toUpperCase().replaceAll(" ", "");
  const [_, suffix] = btw.split(/[A-Z]+[0-9]{2}/);
  const [prefix] = (btw.match(/[A-Z]+[0-9]{2}/) as RegExpMatchArray) ?? [""];
  const _btw = `${prefix} ${suffix}`;
  return _btw;
  // btw = "BE0420.045.137".replaceAll(".", "");
  // console.log(btw, btw.match(/^(\w{2}\d{4})-(\d{3})-(\d)$/));
  // return /^(\d{4})-(\d{3})-(\d)$/.exec(btw);
};
export const generateQRCodeData = ({
  iban,
  message,
  amount,
  name,
  bic = "", // Optional BIC, default to empty for EU IBANs
}: {
  iban: string;
  message: string;
  amount: number | string;
  name: string;
  bic?: string;
}): string => {
  // Input validation
  const cleanIban = iban.replace(/\s/g, ""); // Remove spaces from IBAN
  // if (!cleanIban.match(/^BE\d{14}$/)) {
  //   console.error(
  //     "Invalid Belgian IBAN. Expected format: BEkk BBBB CCCC DDDD EE"
  //   );
  //   return "";
  // }
  if (!name.trim()) {
    console.error("Recipient name is required");
    return "";
  }
  const parsedAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    console.error("Amount must be a positive number");
    return "";
  }
  const formattedAmount = `EUR${parsedAmount.toFixed(2)}`;
  const cleanMessage = message.trim() || ""; // Ensure message is not null

  // EPC069-12 SEPA QR code format (SCT)
  const lines = [
    "BCD", // Service Tag
    "002", // Version
    "1", // Character Set (1 = UTF-8)
    "SCT", // Identification Code
    bic, // BIC (optional, empty for EU IBANs if not provided)
    name.trim(), // Recipient Name (max 70 chars)
    cleanIban, // IBAN
    formattedAmount, // Amount (EUR + value with 2 decimals)
    "", // Purpose Code (optional, empty)
    cleanMessage, // Remittance Information (max 140 chars)
    "", // Beneficiary to Originator Information (optional)
  ];

  console.log(lines);
  // Join lines with newline separator and ensure no trailing newline
  return lines.join("\n").trim();
};

type ValidationItem = {
  validate: (input: string) => string | true;
  onBlur: (
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  ) => (event: React.ChangeEvent<HTMLInputElement>) => void;
};

export const useBeforeLeave = (isDirty: boolean, onSave: () => void) => {
  const isDirtyRef = useRef(false);
  const onSaveRef = useRef(onSave);

  // Keep refs in sync with props
  useEffect(() => {
    isDirtyRef.current = isDirty;
    onSaveRef.current = onSave;
  }, [isDirty, onSave]);

  // Run on mount/unmount only
  useEffect(() => {
    return () => {
      // Only save if form is dirty at unmount
      if (isDirtyRef.current) {
        console.log("saving..");
        onSaveRef.current();
      }
    };
  }, []);
};
