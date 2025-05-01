import React, { useCallback, useState, useEffect, Fragment, memo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { nl } from "date-fns/locale";
// @ts-ignore
import html2pdf from "html2pdf.js";
import { format, isSameDay, isSameMonth, isSameYear } from "date-fns";
import { QRCode } from "react-qrcode-logo";

import {
  DocumentDuplicateIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
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

import { useBillStore, useContacts } from "../../store";
import { useUserStore } from "../../store/userStore";
import { useQrStore } from "src/store/qrCode";

import {
  formatBtwNumber,
  formatIban,
  generateQRCodeData,
  structuredMessage,
} from "src/helpers";

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
  const { settings: qrCodeSettings } = useQrStore();

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
      structuredMessage:
        existingBill?.structuredMessage ?? user?.structuredMessage ?? "",
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
    (sum, a) => sum + calcSubtotal(a),
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
        title: "No user or contact.",
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
            onPress={() => handleSubmit(() => setIsPreviewOpen(true))()}
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
      <div className="">
        <div className="w-1/2">
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
          <div className="flex justify-between gap-2">
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
          </div>
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

        <div className="overflow-y-auto max-h-[90vh]">
          <h2 className="font-semibold my-2">Assignments</h2>
          <table className="w-full border-collapse mb-6">
            <thead>
              <tr className="border-b border-t border-black text-sm text-left">
                <th>Description</th>
                <th>Amount</th>
                <th>Unit price</th>
                <th>btw</th>
                <th>Dates</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((assignment, index) => (
                <tr
                  key={`assignment-${index}-${assignment.id}`}
                  className="border-b border-gray-200 text-sm font-medium font-mono"
                >
                  {/* <div className="flex gap-3 flex-col"> */}
                  {/* <div className="flex gap-1"> */}
                  <td>
                    <Controller
                      name={`assignments.${index}.description`}
                      control={control}
                      rules={{ required: "Required" }}
                      render={({ field }) => (
                        <Input
                          isRequired
                          className="flex-5"
                          label="Description"
                          value={field.value}
                          onChange={field.onChange}
                          isInvalid={!!errors.assignments?.[index]?.description}
                          errorMessage={
                            errors.assignments?.[index]?.description?.message
                          }
                        />
                      )}
                    />
                  </td>
                  <td>
                    <Controller
                      name={`assignments.${index}.quantity`}
                      control={control}
                      rules={{ required: "Required", min: 1 }}
                      render={({ field }) => (
                        <Input
                          isRequired
                          label="Amount"
                          type="number"
                          className="flex-1"
                          value={field.value.toString()}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                          isInvalid={!!errors.assignments?.[index]?.quantity}
                          errorMessage={
                            errors.assignments?.[index]?.quantity?.message
                          }
                        />
                      )}
                    />
                  </td>
                  <td>
                    <Controller
                      name={`assignments.${index}.unitPrice`}
                      control={control}
                      rules={{ required: "Required", min: 0 }}
                      render={({ field }) => (
                        <Input
                          isRequired
                          className="flex-1"
                          label="Unitprice"
                          type="number"
                          value={field.value.toString()}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value))
                          }
                          isInvalid={!!errors.assignments?.[index]?.unitPrice}
                          errorMessage={
                            errors.assignments?.[index]?.unitPrice?.message
                          }
                        />
                      )}
                    />
                  </td>
                  <td>
                    <Controller
                      name={`assignments.${index}.btw`}
                      control={control}
                      render={({ field }) => (
                        <Select
                          isRequired
                          label="BTW"
                          defaultSelectedKeys={[field.value.toString()]}
                          className="flex-1"
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
                  </td>
                  {/* </div> */}
                  <td className="flex gap-1">
                    <Controller
                      name={`assignments.${index}.startDate`}
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          // minDate={new Date()}
                          label="Start date"
                          value={field.value ? new Date(field.value) : null}
                          onChange={(value) =>
                            field.onChange(value?.toString())
                          }
                          className="flex-1"
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
                          onChange={(value) =>
                            field.onChange(value?.toString())
                          }
                          className="flex-1"
                        />
                      )}
                    />
                    <div className="flex-1"></div>
                  </td>
                  {/* <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      // color="primary"
                      onPress={() => insert(index + 1, { ...assignment })}
                    >
                      Copy
                    </Button>
                    <Button
                      variant="ghost"
                      // color="warning"
                      onPress={() => remove(index)}
                    >
                      Remove
                    </Button>
                  </div> */}
                  {/* </div> */}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-center items-center">
            <Button
              variant="light"
              color="primary"
              startContent={<PlusIcon className="h-5 w-5" />}
              onPress={() => append(emptyAssignment)}
              isIconOnly
              size="lg"
              className="m-auto"
              title="add new assignment"
            />
          </div>
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
                      <tr className="border-b border-t border-black text-sm text-left">
                        <th>Omschrijving</th>
                        <th>Aantal</th>
                        <th>Eenheidsprijs</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formValues.assignments.map((a, index) => (
                        <tr
                          key={`row-${index}-${a.description}`}
                          className="border-b border-gray-200 text-sm font-medium font-mono"
                        >
                          <td>
                            {`${a.description} ${formatDateRange(
                              new Date(a.startDate),
                              new Date(a.endDate)
                            )}`}
                          </td>
                          <td>
                            {`${a.quantity} ${a.unit ? `(${a.unit})` : ""}`}
                          </td>
                          <td>{`${calcSubtotal(a).toFixed(2)} x ${
                            a.quantity
                          }`}</td>
                          <td>
                            {`${calculateBtwAmount(a).toFixed(2)} (${a.btw}%)`}
                          </td>
                          {/* <td >{a.description}</td> */}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mb-6 flex justify-end w-full">
                    <Totals
                      rows={[
                        ["Subtotaal", totalExclBtw],
                        ["btw", totalBtw],
                        ["Totaal", totalInclBtw],
                      ]}
                    />
                  </div>
                  <div className="flex items-end h-full">
                    <div className="mt-4 flex h-fit">
                      <QRCode
                        value={generateQRCodeData({
                          iban: formatIban(user.iban),
                          message: formValues.structuredMessage,
                          amount: totalInclBtw,
                          name: user.name,
                        })}
                        size={130}
                        qrStyle="dots"
                        ecLevel="M"
                        logoImage={user.logo}
                        {...qrCodeSettings}
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
    formatBtwNumber(user.btw),
    formatIban(user.iban),
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

      {details.join(" ").includes("undefined") && (
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

// Calculate totals
const calcSubtotal = (assignment: Assignment) =>
  assignment.quantity * assignment.unitPrice;

const calculateBtwAmount = (assignment: Assignment) =>
  calcSubtotal(assignment) * (assignment.btw / 100);

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

const formatDate = (d: string | Date) =>
  format(new Date(d), "dd/MM/yyyy", {
    locale: nl,
  });

function formatDateRange(start: Date, end: Date): string {
  return `${formatDate(start)} - ${formatDate(end)}`;

  if (isSameDay(start, end)) {
    return format(start, "dd/MM/yyyy");
  }
  if (isSameMonth(start, end) && isSameYear(start, end)) {
    return `${format(start, "d")}-${format(end, "d MMM yyyy")}`;
  }
  if (isSameYear(start, end)) {
    return `${format(start, "d MMM")} - ${format(end, "d MMM yyyy")}`;
  }
  return `${format(start, "dd/MM/yyyy")} - ${format(end, "dd/MM/yyyy")}`;
}
