export const structuredMessage = {
  validate: (input: string) => {
    if (input.includes("+")) {
      return "The '+' are added automatically later.";
    }

    const digits = input.replace(/[^\d]/g, "");
    if (digits.length !== 11 && digits.length !== 12) {
      return `Must be 11 or 12 numbers (now: ${digits.length}).`;
    }

    if (!/^[0-9/]+$/.test(input.replace(/[^\d/]/g, ""))) {
      return "Only numbers or / are allowed";
    }

    return true;
  },

  onBlur:
    (onChange: (value: string) => void) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      let value = event.target.value.replace(/[^\d]/g, "").slice(0, 12); // Remove non-digits

      // Format based on digit count
      if (value.length === 11) {
        // Format as XX/XXXX/XXXXX
        value = `${value.slice(0, 2)}/${value.slice(2, 6)}/${value.slice(6)}`;
      } else if (value.length === 12) {
        // Format as XXX/XXXX/XXXXX
        value = `${value.slice(0, 3)}/${value.slice(3, 7)}/${value.slice(7)}`;
      }

      // Update the form value via react-hook-form's onChange
      onChange(value);
    },
};

const _structuredMessage = {
  _validate: (msg: string) =>
    /^(?:[0-9]{2,3}\/[0-9]{4}\/[0-9]{5}|\+[0-9]+\/[0-9]+\/[0-9]+)$/.test(
      msg.replace(/\D/g, "")
    ) || "Incorrect format",

  validate: (input: string) => {
    if (input.includes("+")) {
      return `Format for + signs will be added automatically. Remove them here.`;
    }
    const nrInput = input.replace(/[^\d]/g, "").length;
    if (![11, 12].includes(nrInput)) {
      return `need to include 11 or 12 digits (${
        nrInput < 11 ? 11 - nrInput : 12 - nrInput
      })`;
    }
    return true;
  },

  onBlur:
    (onChange: (e: React.ChangeEvent<HTMLInputElement>) => void) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const digits = event.target.value.replace(/[^\d]/g, "");
      if (![11, 12].includes(digits.length)) {
        return;
      }

      digits.slice();

      let value = event.target.value.replaceAll(/\D/g, "");
      value = value.replace(/^([0-9]{1,3})/, "$1/");
      if (value.length >= 7) {
        value = value.replace(/([0-9]{4})$/, "/$1");
      }
      // modify event value
      event.target.value = value;
      onChange(event);
    },
};

export const formatIban = (iban: string) => {
  const [country] = iban.split(/\d+/);
  return `${country.replaceAll(" ", "")} ${iban.replace(/\D/g, "")}`;
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
