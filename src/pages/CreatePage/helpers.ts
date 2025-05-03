export const now = new Date().toString();
export const emptyAssignment: Assignment = {
  description: "",
  startDate: now,
  endDate: now,
  quantity: 1,
  unitPrice: 0,
  btw: 21,
};

type ValidationItem = {
  validate: (input: string) => string | true;
  onBlur: (
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  ) => (event: React.ChangeEvent<HTMLInputElement>) => void;
};

export const validation_message: ValidationItem = {
  validate: (input: string) => {
    if (!/[\d\+\\]/.test(input)) {
      return "invalid characters (0-9 or / or +++)";
    }

    const nrInput = input.replace(/[^\d]/g, "").length;
    if (![11, 12].includes(nrInput)) {
      return `need to contain 11 or 12 digits (currently ${nrInput})`;
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
        value = `+++${value}+++`;
      }
      // modify event value
      event.target.value = value;
      onChange(event);
    },
};
