import { QRCode } from "react-qrcode-logo";

import { useUserStore } from "src/store";

import { Button, Input, Select, SelectItem } from "@heroui/react";
import {
  ChangeEvent,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { generateQRCodeData } from "src/helpers";
import { useQrStore } from "src/store/qrCode";
import { debounce } from "@mui/material";

type FormType = Pick<User, "iban" | "name"> & {
  amount: string;
  message: string;
};

const qrStyles: Array<QrCodeSettings["qrStyle"]> = ["dots", "fluid", "squares"];

const field: (keyof FormType)[] = ["iban", "message", "amount", "name"];

export const QrPage = () => {
  const { user } = useUserStore();
  const { settings, updateSettings } = useQrStore();

  const [qrProps, setQrProps] = useState<QrCodeSettings>({
    ...settings,
  });

  const [form, setForm] = useState<FormType>({
    iban: user?.iban ?? "AB 000000000000000000",
    message: user?.structuredMessage ?? "",
    amount: "0",
    name: user?.name ?? "Test",
  });

  useEffect(() => {
    updateSettings(qrProps);
  }, [qrProps]);

  const update = useCallback(
    (key: keyof FormType, asBool?: boolean) => (e: ChangeEvent) => {
      const v = (e.target as HTMLInputElement).value;

      setForm((prev) => ({
        ...prev,
        [key]: asBool ? !Boolean(JSON.parse(v)) : v,
      }));
    },
    []
  );

  const updateQr = useCallback(
    (key: keyof QrCodeSettings, asBool?: boolean) => (e: ChangeEvent) => {
      const v = (e.target as HTMLInputElement).value;

      setQrProps((prev) => ({
        ...prev,
        [key]: asBool ? Boolean(JSON.parse(v)) : v,
      }));
    },
    []
  );

  return (
    <div className="w-full h-full flex flex-wrap">
      <div className="flex flex-wrap items-start flex-2">
        <div className="w-full flex h-fit">
          {/* {field.map((i) => (
            <Input
              key={i}
              isRequired
              label={i}
              type={i === "amount" ? "number" : undefined}
              value={form[i]?.toString()}
              onChange={update(i)}
              className="px-3 py-1"
            />
          ))} */}
        </div>

        <div className="flex justify-center items-center flex-1">
          <QRCode
            value={generateQRCodeData(form)}
            qrStyle="dots"
            fgColor="grey"
            bgColor="black"
            {...qrProps}
            logoImage={!Boolean(qrProps.enableLogo) ? undefined : user?.logo}
            size={300}
            ecLevel="L"
            style={{
              boxShadow: "0px 0px 20px 0px #fff5",
            }}
          />
        </div>
      </div>

      <div className="bg-[#111] py-3 pl-2 flex flex-col flex-1 h-[100vh] justify-between">
        <div className="pr-2 *:flex *:flex-col flex-1 overflow-y-scroll">
          <h3 className="text-xl font-black my-5">Customize</h3>
          <div>
            <Select
              label="Qr style"
              value={qrProps.qrStyle}
              defaultSelectedKeys={
                qrProps.qrStyle ? [qrProps.qrStyle] : undefined
              }
              onChange={updateQr("qrStyle")}
              className="mb-4"
              disallowEmptySelection
            >
              {qrStyles.map((i) => (
                <SelectItem key={i}>{i}</SelectItem>
              ))}
            </Select>
            <Select
              label="Foreground"
              value={qrProps.fgColor}
              defaultSelectedKeys={
                qrProps.fgColor ? [qrProps.fgColor] : undefined
              }
              onChange={updateQr("fgColor")}
              className="mb-4"
              disallowEmptySelection
            >
              {["black", "white", "grey"].map((i) => (
                <SelectItem key={i}>{i}</SelectItem>
              ))}
            </Select>
            <Select
              label="Background"
              value={qrProps.bgColor}
              defaultSelectedKeys={
                qrProps.bgColor ? [qrProps.bgColor] : undefined
              }
              onChange={updateQr("bgColor")}
              className="mb-4"
            >
              {["black", "white", "grey"].map((i) => (
                <SelectItem key={i}>{i}</SelectItem>
              ))}
            </Select>
            <Select
              label="Enable/disable logo"
              value={String(!!qrProps.enableLogo)}
              defaultSelectedKeys={[String(qrProps.enableLogo)]}
              onChange={updateQr("enableLogo", true)}
              className="mb-4"
              disallowEmptySelection
            >
              {[true, false].map((i) => (
                <SelectItem key={String(i)}>
                  {!i ? "Disable" : "Enable"}
                </SelectItem>
              ))}
            </Select>
          </div>
        </div>

        <div className="w-full flex justify-center items-center h-[100px]">
          <div className="text-center">
            {/* <Button
              type="button"
              color="primary"
              // className="w-[60%] py-2 m-auto"
              onPress={onSave}
            >
              Save
            </Button> */}
            <p className="text-md text-[#555] italic pt-1">
              Changes are saved automatically when updating.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
