import { isValid as isIbanValid, toBBAN, printFormat } from "iban-ts";
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router";

// type Fn = {
//   validate: (i: string)=> boolean | string | void
//   onBlur: (onChange: (value: string) => void) =>
//     (event: React.ChangeEvent<HTMLInputElement>) => void
// }
export const validationMessage: ValidationItem = {
  validate: (input: string) => {
    if (!/[\d\+\\]/g.test(input)) {
      return "invalid characters (0-9 or / or +++)";
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

export const formatIban = (iban: string) => {
  return printFormat(iban);
  const [country] = iban.split(/\d+/);
  return `${country.replaceAll(" ", "")} ${iban.replace(
    /\D/g,
    ""
  )}`.toUpperCase();
};

export const formatBtwNumber = (btw: string) => {
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
}: {
  iban: string;
  message: string;
  amount: number | string;
  name: string;
}): string => {
  // if (!iban.match(/^\D{2}\d{14}$/) || !message.trim() || amount <= 0) {
  //   throw new Error("Invalid input");
  // }
  // see https://github.com/smhg/sepa-qr-js/blob/master/test/index.js
  const serviceTag = "BCD",
    version = "002",
    characterSet = 1,
    identification = "SCT",
    bic = "",
    purpose = "",
    remittance = message,
    information = "";

  if (!isNaN(Number(amount))) {
    amount = Number(amount).toFixed(2);
  }

  return [
    serviceTag,
    version,
    characterSet,
    identification,
    bic,
    name,
    iban,
    `EUR${amount}`,
    purpose,
    remittance,
    information,
  ].join("\n");

  // const formattedAmount = `EUR${amount.toFixed(2)}`;
  // return `BCD\n001\n1\nSCT\n\n${name}\n${iban}\n${formattedAmount}\n\n\n${structuredMessage}`;
};

type ValidationItem = {
  validate: (input: string) => string | true;
  onBlur: (
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  ) => (event: React.ChangeEvent<HTMLInputElement>) => void;
};

export const useBeforeLeave = (shouldBlock: boolean, callback: () => void) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isNavigating, setIsNavigating] = useState(false);
  const [nextPath, setNextPath] = useState<string | null>(null);

  const handleHashChange = useCallback(
    (event: HashChangeEvent) => {
      if (!shouldBlock) return;

      // Prevent the default hash change behavior
      event.preventDefault();

      // Extract the new hash path
      const newHash = new URL(event.newURL).hash.replace("#", "");
      if (newHash === location.pathname) return;

      // Store the intended navigation path
      setNextPath(newHash);
      setIsNavigating(true);
    },
    [shouldBlock, location.pathname]
  );

  useEffect(() => {
    if (!shouldBlock) return;

    // Listen for hash changes (triggered by HashRouter navigation)
    window.addEventListener("hashchange", handleHashChange);

    // Also handle browser back/forward buttons or manual URL changes
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (shouldBlock) {
        event.preventDefault();
        event.returnValue = ""; // Modern browsers require this to show a confirmation dialog
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [shouldBlock, handleHashChange]);

  useEffect(() => {
    if (isNavigating && nextPath) {
      // Trigger the callback (e.g., show a confirmation dialog)
      callback();

      // After the callback, decide whether to proceed with navigation
      // For simplicity, we assume the callback handles user confirmation
      // If the user confirms, proceed with navigation
      navigate(nextPath);
      setIsNavigating(false);
      setNextPath(null);
    }
  }, [isNavigating, nextPath, callback, navigate]);
};
