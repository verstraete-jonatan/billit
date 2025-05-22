import { QRCode } from "react-qrcode-logo";

import { useUserStore } from "src/store";

import { Input, Select, SelectItem, Switch } from "@heroui/react";
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { generateQRCodeData } from "src/helpers";
import { useQrStore } from "src/store/qrCode";

const qrStyles: Array<QrCodeSettings["qrStyle"]> = ["dots", "fluid", "squares"];
const colors = ["black", "white", "grey"];

export const CustomQr = () => {
  const { user, setUser } = useUserStore();
  const { settings, updateSettings } = useQrStore();

  const [qrProps, setQrProps] = useState<QrCodeSettings>(settings);

  const qrData = useMemo(
    () =>
      generateQRCodeData({
        iban: user?.iban ?? "AB 000000000000000000",
        message: user?.structuredMessage ?? "",
        amount: "0",
        name: user?.name ?? "Test",
      }),
    []
  );

  const handleLogoChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setUser({ ...(user ?? {}), logo: reader.result as string });
        };
        reader.readAsDataURL(file);
      }
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

  useEffect(() => {
    if (settings !== qrProps) {
      updateSettings(qrProps);
    }
  }, [qrProps]);

  return (
    <div className="w-full h-full flex flex-wrap">
      <div className="flex justify-center items-center flex-2 bg-modal">
        <QRCode
          value={qrData}
          qrStyle="dots"
          fgColor="grey"
          bgColor="black"
          {...qrProps}
          logoImage={!Boolean(qrProps.enableLogo) ? undefined : user?.logo}
          size={300}
          ecLevel="L"
          style={{
            boxShadow: "0px 0px 200px 200px #fff2",
            borderRadius: 10,
          }}
        />
      </div>

      <div className="bg-modal py-3 pl-2 flex flex-col flex-1 h-[100vh] justify-between shadow-xl">
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
              {colors.map((i) => (
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
              {colors.map((i) => (
                <SelectItem key={i}>{i}</SelectItem>
              ))}
            </Select>
            <Switch
              isSelected={!!qrProps.enableLogo}
              value={String(!qrProps.enableLogo)}
              onChange={updateQr("enableLogo", true)}
            >
              {qrProps.enableLogo ? "Logo enabled" : "Logo disabled"}
            </Switch>

            {/* Logo Upload */}
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-400">Update logo</label>
              <Input
                placeholder="Update logo"
                type="file"
                accept="image/png"
                onChange={handleLogoChange}
              />
              <img
                src={user?.logo}
                alt="Logo Preview"
                className="h-16 w-16 object-contain mt-2 rounded-lg border border-gray-600"
              />
            </div>
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
              Changes are saved automatically
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
