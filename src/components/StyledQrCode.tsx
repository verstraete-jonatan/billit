import { memo, useMemo } from "react";
import { useUserStore } from "../store/userStore";
import { formatIban, useDebounce } from "src/helpers";
import { QRCode } from "react-qrcode-logo";
import { useQrCodeSettings } from "src/store/qrCode";

type QrCodeData = {
  iban: string;
  message: string;
  amount: number | string;
  name: string;
  bic?: string;
};

type StyledQrCodeProps = Pick<QrCodeData, "amount" | "message"> &
  Pick<QrCodeSettings, "size">;

export const StyledQrCode = memo(
  ({ message, amount, size = 130 }: StyledQrCodeProps) => {
    const { user } = useUserStore();
    const qrCodeSettings = useQrCodeSettings();

    const debMessage = useDebounce(message);
    const debAmount = useDebounce(amount);

    const qrData = useMemo(
      () =>
        generateQRCodeData({
          iban: formatIban(user.iban),
          message: debMessage,
          amount: debAmount,
          name: user.name,
        }),
      [debAmount, debMessage]
    );

    return (
      <QRCode
        qrStyle="dots"
        fgColor="grey"
        bgColor="black"
        {...qrCodeSettings}
        value={qrData}
        logoImage={qrCodeSettings.enableLogo ? user.logo : undefined}
        size={size}
        ecLevel="L"
        logoPadding={0}
        style={{
          boxShadow: "0px 0px 200px 200px #fff2",
          borderRadius: 10,
          padding: 5,
        }}
      />
    );
  }
);

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
  if (isNaN(parsedAmount) || parsedAmount < 0) {
    console.error("Amount must be a positive number", parsedAmount);
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

  // Join lines with newline separator and ensure no trailing newline
  return lines.join("\n").trim();
};
