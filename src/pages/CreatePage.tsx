import React, {
  useCallback,
  useState,
  useEffect,
  ChangeEvent,
  Suspense,
  ReactNode,
  Fragment,
  useRef,
  memo,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useFieldArray, Controller } from "react-hook-form";

// @ts-ignore
import html2pdf from "html2pdf.js";

import { DatePicker } from "@mui/x-date-pickers";
import {
  Button,
  Modal,
  ModalContent,
  ModalFooter,
  Input,
  Select,
  SelectItem,
  Card,
  Image,
  addToast,
} from "@heroui/react";
import { PlusIcon, TrashIcon } from "@heroicons/react/20/solid";
import { QRCode } from "react-qrcode-logo";

import { useBillStore, useContacts } from "../store";
import { useUserStore } from "../store/userStore";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

type BillForm = {
  contactId: string;
  expirationDate: string;
  billingNumber: string;
  structuredMessage: string;
  assignments: Assignment[];
};

const now = new Date().toString();
const emptyAssignment: Assignment = {
  description: "",
  startDate: now,
  endDate: now,
  quantity: 1,
  unitPrice: 0,
  btw: 21,
};

export const CreateBill: React.FC = () => {
  const { bill_id } = useParams<{ bill_id: string }>();
  const navigate = useNavigate();

  const { addBill, updateBill, bills } = useBillStore();
  const contacts = useContacts();
  const { user } = useUserStore();

  const isEditMode = !!bill_id && bills.some((bill) => bill.id === bill_id);
  const existingBill = bills.find((bill) => bill.id === bill_id);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid },
    trigger,
  } = useForm<BillForm>({
    mode: "onChange",
    defaultValues: {
      contactId: existingBill?.contact?.id || "",
      expirationDate: existingBill?.expirationDate || "",
      billingNumber: existingBill?.billingNumber || "123",
      structuredMessage: existingBill?.structuredMessage || "",
      assignments: existingBill?.assignments || [emptyAssignment],
    },
  });

  const { fields, append, remove, insert } = useFieldArray<BillForm>({
    control,
    name: "assignments",
  });

  const formValues = watch();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isLoading, setLoading] = useState(false);

  const totalExclBtw = formValues.assignments.reduce(
    (sum, a) => sum + calculateSubtotal(a),
    0
  );
  const totalBtw = formValues.assignments.reduce(
    (sum, a) => sum + calculateBtwAmount(a),
    0
  );
  const totalInclBtw = totalExclBtw + totalBtw;
  const selectedContact = contacts.find((c) => c.id === formValues.contactId);

  const onSave = (data: BillForm) => {
    if (!user || !selectedContact) {
      addToast({
        color: "danger",
        title: "No user or contact. Edit this in the sidebar.",
      });
      return;
    }

    const billData: Bill = {
      id: isEditMode ? bill_id : generateBillId(),
      user,
      contact: selectedContact,
      status: "DRAFT",
      expirationDate: data.expirationDate,
      billingNumber: data.billingNumber,
      structuredMessage: data.structuredMessage,
      assignments: data.assignments,
    };

    if (isEditMode) {
      updateBill(billData);
    } else {
      addBill(billData);
    }

    navigate("/bills");
  };

  const handleExport = useCallback(async () => {
    setLoading(true);
    await onExport(formValues.billingNumber);
    setLoading(false);
  }, [formValues.billingNumber]);

  useEffect(() => {
    if (!user?.iban) {
      addToast({
        color: "danger",
        title:
          "We need your details for these bills. Please update your details in the sidebar first.",
      });
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen p-6 bg-black text-white overflow-y-auto max-h-full">
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold">
          {isEditMode ? "Edit bill" : "New bill"}
        </h2>

        <div className="space-x-2">
          <Button
            color="primary"
            onPress={() => setIsPreviewOpen(true)}
            disabled={!isValid || !formValues.assignments.length}
          >
            Preview
          </Button>
          <Button
            variant="bordered"
            color="primary"
            onPress={() => handleSubmit(onSave)()}
          >
            Save (draft)
          </Button>
        </div>
      </div>

      {/* Form Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Controller
            name="contactId"
            control={control}
            rules={{ required: "Contact is verplicht" }}
            render={({ field }) => (
              <Select
                isRequired
                label="Contact"
                placeholder="Selecteer een contact"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                className="mb-4"
                isInvalid={!!errors.contactId}
                errorMessage={errors.contactId?.message}
              >
                {contacts.map((contact) => (
                  <SelectItem key={contact.id}>{contact.name}</SelectItem>
                ))}
              </Select>
            )}
          />
          <Controller
            name="expirationDate"
            control={control}
            rules={{ required: "Required" }}
            render={({ field }) => (
              <DatePicker
                label="Vervaldatum"
                value={field.value ? new Date(field.value) : null}
                onChange={(value) => field.onChange(value?.toString())}
                minDate={new Date()}
                className="mb-4"
                slotProps={{
                  textField: {
                    error: !!errors.expirationDate,
                    helperText: errors.expirationDate?.message,
                  },
                }}
              />
            )}
          />
          <Controller
            name="billingNumber"
            control={control}
            rules={{ required: "Factuurnummer is verplicht" }}
            render={({ field }) => (
              <Input
                isRequired
                label="Factuurnummer"
                value={field.value}
                onChange={field.onChange}
                className="mb-4"
                isInvalid={!!errors.billingNumber}
                errorMessage={errors.billingNumber?.message}
              />
            )}
          />
          <Controller
            name="structuredMessage"
            control={control}
            rules={{
              required: "Required",
              validate: (value) => structuredMessage.validate(value),
            }}
            render={({ field }) => (
              <Input
                isRequired
                max={12 + 2 + 6}
                label="Gestuctureerde mededeling"
                value={field.value}
                onChange={field.onChange}
                onBlur={structuredMessage.onBlur(field.onChange)}
                className="mb-4"
                isInvalid={!!errors.structuredMessage}
                errorMessage={errors.structuredMessage?.message}
              />
            )}
          />
        </div>

        <div className="overflow-y-auto">
          <h3 className="font-semibold mb-2">Assignments</h3>
          {fields.map((assignment, index) => (
            <div key={assignment.id} className="border p-4 rounded-lg mb-4">
              <Controller
                name={`assignments.${index}.description`}
                control={control}
                rules={{ required: "Required" }}
                render={({ field }) => (
                  <Input
                    size="sm"
                    isRequired
                    label="Description"
                    value={field.value}
                    onChange={field.onChange}
                    className="mb-2"
                    isInvalid={!!errors.assignments?.[index]?.description}
                    errorMessage={
                      errors.assignments?.[index]?.description?.message
                    }
                  />
                )}
              />
              <Controller
                name={`assignments.${index}.startDate`}
                control={control}
                render={({ field }) => (
                  <DatePicker
                    label="Start date"
                    value={field.value ? new Date(field.value) : null}
                    onChange={(value) => field.onChange(value?.toString())}
                    className="mb-2 !text-white"
                  />
                )}
              />
              <Controller
                name={`assignments.${index}.endDate`}
                control={control}
                render={({ field }) => (
                  <DatePicker
                    label="End date"
                    value={field.value ? new Date(field.value) : null}
                    onChange={(value) => field.onChange(value?.toString())}
                    className="mb-2"
                  />
                )}
              />
              <Controller
                name={`assignments.${index}.quantity`}
                control={control}
                rules={{ required: "Required", min: 1 }}
                render={({ field }) => (
                  <Input
                    isRequired
                    size="sm"
                    label="Aantal"
                    type="number"
                    value={field.value.toString()}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                    className="mb-2"
                    isInvalid={!!errors.assignments?.[index]?.quantity}
                    errorMessage={
                      errors.assignments?.[index]?.quantity?.message
                    }
                  />
                )}
              />
              <Controller
                name={`assignments.${index}.unitPrice`}
                control={control}
                rules={{ required: "Required", min: 0 }}
                render={({ field }) => (
                  <Input
                    isRequired
                    size="sm"
                    label="Eenheidsprijs"
                    type="number"
                    value={field.value.toString()}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    className="mb-2"
                    isInvalid={!!errors.assignments?.[index]?.unitPrice}
                    errorMessage={
                      errors.assignments?.[index]?.unitPrice?.message
                    }
                  />
                )}
              />
              <Controller
                name={`assignments.${index}.btw`}
                control={control}
                render={({ field }) => (
                  <Select
                    isRequired
                    size="sm"
                    label="BTW"
                    // value={field.value.toString()}
                    // onChange={(e) =>
                    //   field.onChange(parseInt(e.target.value) as 6 | 12 | 21)
                    // }
                    defaultSelectedKeys={[field.value.toString()]}
                    className="mb-2"
                  >
                    <SelectItem key="6">
                      6%
                      <p>{field.value}</p>
                    </SelectItem>
                    <SelectItem key="12">12%</SelectItem>
                    <SelectItem key="21">21%</SelectItem>
                  </Select>
                )}
              />

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onPress={() => insert(index + 1, assignment)}
                  size="sm"
                >
                  Copy
                </Button>
                <Button
                  variant="ghost"
                  color="danger"
                  onPress={() => remove(index)}
                  startContent={<TrashIcon className="h-5 w-5" />}
                  size="sm"
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
          <Button
            variant="flat"
            startContent={<PlusIcon className="h-5 w-5" />}
            onPress={() => append(emptyAssignment)}
          >
            Add Assignment
          </Button>
        </div>
      </div>

      {/* Preview Modal */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        size="full"
        className="bg-black"
      >
        <ModalContent>
          <div
            className="flex item-center justify-center bg-black"
            style={{
              // transform: "scale(0.8)",
              transformOrigin: `${window.innerWidth / 2} ${
                window.innerHeight / 2
              }`,
            }}
          >
            <div
              className="overflow-y-scroll w-full h-full p-10"
              style={{ maxHeight: "100vh" }}
            >
              {user && selectedContact && isPreviewOpen ? (
                <Card
                  className="p-6 bg-white text-black shadow-2xl shadow-white w-[210mm] h-[297mm] mx-auto"
                  id="preview-content"
                >
                  <div className="w-full flex justify-between items-end relative mb-5">
                    <Image
                      src={user.logo}
                      alt="Logo"
                      className="h-24 w-auto mb-5"
                    />
                    <div className="flex">
                      <div className="top-0 left-0 absolute flex items-center justify-center w-full h-full mr-3 ">
                        <h1 className="text-3xl font-black uppercase">
                          Factuur
                        </h1>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between my-6">
                    <TableishUser user={user} />
                    <TableishUser user={selectedContact} />
                  </div>

                  <div className="w-fit mb-10">
                    <Tableish
                      data={{
                        Datum: format(new Date(), "dd/MM/yyyy", {
                          locale: nl,
                        }),
                        "Te betalen voor": formatDate(
                          formValues.expirationDate
                        ),
                        Factuurnummer: formValues.billingNumber,
                      }}
                    />
                  </div>

                  <table className="w-full border-collapse mb-6">
                    <thead>
                      <tr className="border-b border-t border-black text-sm">
                        <th className="text-left py-2">Omschrijving</th>
                        <th className="text-right py-2">Aantal</th>
                        <th className="text-right py-2">Eenheidsprijs</th>
                        <th className="text-right py-2">Subtotaal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formValues.assignments.map((a, index) => (
                        <tr
                          key={index}
                          className="border-b border-gray-200 text-sm"
                        >
                          <td className="py-2 text-xs">{`${
                            a.description
                          } ${formatDate(a.startDate)} - ${formatDate(
                            a.endDate
                          )}`}</td>
                          <td className="text-right py-2">{a.quantity}</td>
                          <td className="text-right py-2">
                            {a.unitPrice.toFixed(2)}
                          </td>
                          <td className="text-right py-2">
                            {calculateSubtotal(a).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mb-6 flex justify-end w-full">
                    <Totals
                      rows={[
                        ["Subtotaal", totalExclBtw],
                        [`${formValues.assignments[0]?.btw}% BTW`, totalBtw],
                        ["Totaal", totalInclBtw],
                      ]}
                    />
                  </div>
                  <div className="flex items-end h-full">
                    <div className="mt-4 flex h-fit">
                      <QRCode
                        value={generateQRCodeData({
                          iban: user.iban,
                          message: formValues.structuredMessage,
                          amount: totalInclBtw,
                          name: user.name,
                        })}
                        size={130}
                        qrStyle="dots"
                        logoImage={user.logo}
                        ecLevel="M"
                      />
                      <Tableish
                        title="Betalingsinformatie"
                        data={{
                          IBAN: formatIban(user.iban),
                          Mededeling: `+++${formValues.structuredMessage}+++`,
                          "Te betalen voor": formatDate(
                            formValues.expirationDate
                          ),
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-grey text-sm w-full text-right">
                    <p>Algemenege voorwaarden:</p>
                    <a href={user.voorWaardedenUrl} className="text-primary">
                      {user.voorWaardedenUrl}
                    </a>
                  </div>
                </Card>
              ) : (
                <div>No user or selected contact found</div>
              )}
            </div>
          </div>
          <ModalFooter className="absolute bottom-0 m-10 w-fit">
            <Button onPress={() => setIsPreviewOpen(false)}>Close</Button>
            <Button
              color="primary"
              isLoading={isLoading}
              onPress={handleExport}
            >
              Export PDF
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

const Text = ({
  children,
  ...props
}: { children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) => (
  <div {...props} className={`text-sm ${props.className}`}>
    {children}
  </div>
);

const Tableish = ({
  data,
  title,
}: {
  data: Record<string, string | number>;
  title?: string;
}) => (
  <div className="min-w-[300px]">
    {title && <div className="font-black">{title}</div>}
    <div className="grid grid-cols-2 gap-0.5">
      {Object.entries(data).map(([key, value]) => (
        <Fragment key={key}>
          <div className="font-medium pr-2 text-sm">{key}:</div>
          <div className="text-[#111] text-sm">{value}</div>
        </Fragment>
      ))}
    </div>
  </div>
);

export const Totals = ({ rows }: { rows: [string, number][] }) => {
  return (
    <div className="w-[300px]">
      {rows.map(([label, value], index) => {
        const isLastRow = index === rows.length - 1;
        return (
          <div
            key={index}
            className={`flex justify-between py-2 px-4 ${
              isLastRow ? "bg-gray-800 text-white" : ""
            }`}
          >
            <div className="flex-1">
              <p className={`${isLastRow ? "text-white" : ""}`}>{label}</p>
            </div>
            <div className="flex-1 text-right">
              <p className={isLastRow ? "text-white" : ""}>
                € {value.toFixed(2)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const TableishUser = memo(({ user }: { user: User | Contact }) => {
  const details = [
    `${user.address.street} ${user.address.houseNumber}`,
    user.address.city,
    user.address.country,
    "",
    user.btw,
    user.email,
  ];

  return (
    <div className="w-[300px]">
      <div className="font-bold">{user.name}</div>
      <hr />
      <div className="grid grid-cols-1 gap-0.5">
        {details.map((i, index) => (
          <div
            key={user.name + (i || "-empty") + index}
            className="font-medium pr-2 text-sm block"
          >
            {i || ""}
          </div>
        ))}
      </div>

      {details.join(",").includes("undefined") && (
        <div className="text-red-700 text-1xl">
          ** Missing details are "undefined" double check user(s) **
        </div>
      )}
    </div>
  );
});

// Utility to generate unique bill ID
const generateBillId = () =>
  `BILL-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const generateQRCodeData = ({
  iban,
  message,
  amount,
  name,
}: {
  iban: string;
  message: string;
  amount: number;
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

// Calculate totals
const calculateSubtotal = (assignment: Assignment) =>
  assignment.quantity * assignment.unitPrice;

const calculateBtwAmount = (assignment: Assignment) =>
  calculateSubtotal(assignment) * (assignment.btw / 100);

const structuredMessage = {
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

const formatIban = (iban: string) => {
  const [country] = iban.split(/\d+/);
  return `${country} ${iban.replace(/\D/g, "")}`;
};

const _onExport = async (billingNumber: string | number) => {
  const element = document.getElementById("preview-content");

  const opt = {
    margin: 0,
    filename: `factuur-${billingNumber}.pdf`,
    image: { type: "png", quality: 2 },
    html2canvas: { scale: 1, useCORS: true },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  };

  await html2pdf().set(opt).from(element).save();
};

// const onExport = async (billingNumber: string | number) => {
//   const element = document.getElementById("preview-content");
//   if (!element) {
//     return alert("Ops can't download :|");
//   }

//   // Use html2canvas to render the element with styles
//   const canvas = await html2canvas(element, {
//     scale: 2, // Higher scale for better quality
//     useCORS: true, // If there are external images (e.g., logo)
//     backgroundColor: "#ffffff", // Ensure the background is white
//   });

//   const imgData = canvas.toDataURL("image/png");
//   const pdf = new jsPDF({
//     orientation: "portrait",
//     unit: "mm",
//     format: "a4",
//   });

//   const imgWidth = 210; // A4 width in mm
//   const imgHeight = (canvas.height * imgWidth) / canvas.width; // Maintain aspect ratio
//   pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
//   pdf.save(`factuur-${billingNumber}.pdf`);
// };
const onExport = async (billingNumber: string | number) => {
  const element = document.getElementById("preview-content");

  const opt = {
    filename: `factuur-${billingNumber}.pdf`,
    image: { type: "png", quality: 1 },
    html2canvas: {
      scale: 2, // Higher resolution for better quality
      useCORS: true,
      windowWidth: 794, // A4 width in pixels at 96dpi
      windowHeight: 1123, // A4 height in pixels at 96dpi
    },
    jsPDF: {
      unit: "mm",
      format: "a4",
      orientation: "portrait",
    },
    pagebreak: {
      mode: "avoid-all", // Prevent page breaks
      before: "#preview-content", // Ensure content starts on the first page
    },
  };

  await html2pdf()
    .set(opt)
    .from(element)
    .toPdf()
    .get("pdf")
    .then((pdf: any) => {
      // Ensure only one page is generated
      const totalPages = pdf.internal.getNumberOfPages();
      if (totalPages > 1) {
        for (let i = totalPages; i > 1; i--) {
          pdf.deletePage(i);
        }
      }
    })
    .save();
};

const formatDate = (d: string) =>
  format(new Date(d), "dd/MM/yyyy", {
    locale: nl,
  });
// d
//   ? format(new Date(d), "dd/MM/yyyy", {
//       locale: nl,
//     })
//   : "nope";
