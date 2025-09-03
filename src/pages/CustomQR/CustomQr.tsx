import { QRCode } from "react-qrcode-logo";

import { useUserStore } from "src/store";

import { Input, Select, SelectItem, Switch } from "@heroui/react";
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useQrStore } from "src/store/qrCode";
import { StyledQrCode } from "src/components/StyledQrCode";
import { useImagine } from "src/utils/useImagine";

const qrStyles: Array<QrCodeSettings["qrStyle"]> = ["dots", "fluid", "squares"];
const colors = ["black", "white", "grey", "transparent"];

export const CustomQr = () => {
  const { user, setUser } = useUserStore();
  const { settings, updateSettings } = useQrStore();
  const { images, uploadImg } = useImagine();

  const handleLogoChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        uploadImg(file, "logo");
      }
    },
    [user]
  );

  const updateQr = useCallback(
    (key: keyof QrCodeSettings, asBool?: boolean) => (e: ChangeEvent) => {
      const v = (e.target as HTMLInputElement).value;

      updateSettings({
        [key]: asBool ? Boolean(JSON.parse(v)) : v,
      });
    },
    []
  );

  return (
    <div className="w-full h-full flex flex-wrap">
      <div className="flex justify-center items-center flex-2 bg-modal">
        <StyledQrCode message={""} amount={0} size={350} />
      </div>

      <div className="bg-modal py-3 pl-2 flex flex-col flex-1 h-[100vh] justify-between shadow-xl">
        <div className="pr-2 *:flex *:flex-col flex-1 overflow-y-scroll">
          <h3 className="text-xl font-black my-5">Customize</h3>
          <div>
            <Select
              label="Qr style"
              value={settings.qrStyle}
              defaultSelectedKeys={
                settings.qrStyle ? [settings.qrStyle] : undefined
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
              value={settings.fgColor}
              defaultSelectedKeys={
                settings.fgColor ? [settings.fgColor] : undefined
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
              value={settings.bgColor}
              defaultSelectedKeys={
                settings.bgColor ? [settings.bgColor] : undefined
              }
              onChange={updateQr("bgColor")}
              className="mb-4"
            >
              {colors.map((i) => (
                <SelectItem key={i}>{i}</SelectItem>
              ))}
            </Select>
            <Switch
              isSelected={!!settings.enableLogo}
              value={String(!settings.enableLogo)}
              onChange={updateQr("enableLogo", true)}
            >
              {settings.enableLogo ? "Logo enabled" : "Logo disabled"}
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
                src={images["logo"] || undefined}
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
