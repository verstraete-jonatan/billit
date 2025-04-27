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
    (onChange: (e: ChangeEvent<HTMLInputElement>) => void) =>
    (event: ChangeEvent<HTMLInputElement>) => {
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
