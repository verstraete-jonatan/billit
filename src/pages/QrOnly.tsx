import { QRCode } from "react-qrcode-logo";
import { useUserStore } from "src/store";
import { generateQRCodeData } from "./CreatePage copy 2";
import { Input } from "@heroui/react";
import { ChangeEvent, Suspense, useCallback, useEffect, useState } from "react";

type FormType = Parameters<typeof generateQRCodeData>[0];

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
