import { QRCode } from "react-qrcode-logo";
import { useUserStore } from "src/store";

import { Input } from "@heroui/react";
import { ChangeEvent, Suspense, useCallback, useState } from "react";

type FormType = {
  iban: string;
  message: string;
  amount: number;
  name: string;
};

const generateQRCodeData = ({
  iban,
  message,
  amount,
  name,
}: FormType): string => {
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

  return [
    serviceTag,
    version,
    characterSet,
    identification,
    bic,
    name,
    iban,
    `EUR${amount.toFixed(2)}`,
    purpose,
    remittance,
    information,
  ].join("\n");

  // const formattedAmount = `EUR${amount.toFixed(2)}`;
  // return `BCD\n001\n1\nSCT\n\n${name}\n${iban}\n${formattedAmount}\n\n\n${structuredMessage}`;
};

const field: (keyof FormType)[] = ["iban", "message", "amount", "name"];
export const QROnlyPage = () => {
  const { user } = useUserStore();

  const [form, setForm] = useState<FormType>({
    iban: user?.iban ?? "",
    message: "",
    amount: 0,
    name: user?.name ?? "",
  });

  const update = useCallback(
    (key: keyof FormType) => (e: ChangeEvent) => {
      setForm((prev) => ({
        ...prev,
        [key]: (e.target as HTMLInputElement).value,
      }));
    },
    []
  );

  return (
    <div className="w-full h-full">
      <div className="mb-5">
        {field.map((i) => (
          <Input
            isRequired
            label={i}
            value={form[i]?.toString()}
            onChange={update(i)}
            className="my-1 w-[500px]"
          />
        ))}
      </div>

      <div className="flex justify-center items-center">
        <Suspense fallback={"spomethign went wrong, try again"}>
          <QRCode
            value={generateQRCodeData(form)}
            size={300}
            qrStyle="dots"
            logoImage={user?.logo}
            ecLevel="M"
          />
        </Suspense>
      </div>
    </div>
  );
};
