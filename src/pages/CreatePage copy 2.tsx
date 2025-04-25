import React, { useCallback, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { DatePicker } from "@mui/x-date-pickers";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
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
import { format } from "date-fns";
import { nl } from "date-fns/locale";
// @ts-ignore
import html2pdf from "html2pdf.js";

import { useBillStore, useContacts } from "../store";
import { useUserStore } from "../store/userStore";
import { dummy_bills } from "src/store/_dummy";

// Utility to generate unique bill ID
const generateBillId = () =>
  `BILL-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// Utility to generate QR code data in EU/Belgian SEPA format
export const generateQRCodeData = ({
  iban,
  message,
  amount,
  name,
}: {
  iban: string;
  message: string;
  amount: number | string;
  name: string;
}): string => {
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
    `EUR${Number(amount).toFixed(2)}`,
    purpose,
    remittance,
    information,
  ].join("\n");
};

// Calculate totals
const calculateSubtotal = (assignment: Assignment) =>
  assignment.quantity * assignment.unitPrice;

const calculateBtwAmount = (assignment: Assignment) =>
  calculateSubtotal(assignment) * (assignment.btw / 100);

// Structured message validation
const structuredMessage = {
  validate: (input: string) =>
    [11, 12].includes(input.replace(/[^\d]/g, "").length) || "Incorrect format",
  onBlur:
    (onChange: (e: React.ChangeEvent<HTMLInputElement>) => void) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      let value = event.target.value.replaceAll(/\D/g, "");
      value = value.replace(/^([0-9]{1,3})/, "$1/");
      if (value.length >= 7) {
        value = value.replace(/([0-9]{4})$/, "/$1");
      }
      event.target.value = `+++${value}+++`;
      onChange(event);
    },
};

const formatIban = (iban: string) => {
  const [country] = iban.split(/\d+/);
  return `${country} ${iban.replace(/\D/g, "")}`;
};

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
  const existingBill =
    bills.find((bill) => bill.id === bill_id) || dummy_bills[0];

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<BillForm>({
    mode: "onChange",
    defaultValues: {
      contactId: existingBill?.contact?.id || "",
      expirationDate: existingBill?.expirationDate || "",
      billingNumber: existingBill?.billingNumber || `INV-${Date.now()}`,
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
    const element = document.getElementById("preview-content");
    if (!element) {
      addToast({
        color: "danger",
        title: "Preview content not found.",
      });
      setLoading(false);
      return;
    }

    const opt = {
      margin: 0,
      filename: `factuur-${formValues.billingNumber}.pdf`,
      image: { type: "jpeg", quality: 1 },
      html2canvas: { scale: 1, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      addToast({
        color: "danger",
        title: "Error exporting PDF.",
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [formValues.billingNumber]);

  useEffect(() => {
    if (!user?.iban) {
      addToast({
        color: "danger",
        title:
          "We need your details for these bills. Please update your details in the sidebar first.",
      });
    }
  }, [user?.iban]);

  return (
    <div className="flex flex-col min-h-screen p-6 bg-black text-white overflow-y-auto max-h-full">
      <div className="flex justify-between mb-6">
        <h2 className="text-2xl font-bold">
          {isEditMode ? "Edit bill" : "New bill"}
        </h2>
        <Text>
          Fill in all details {">"} preview {">"} export
        </Text>
        <div className="space-x-2">
          <Button
            color="primary"
            onPress={() => setIsPreviewOpen(true)}
            disabled={!isValid}
            size="lg"
          >
            Preview
          </Button>
          <Button
            variant="solid"
            color="success"
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

        <div>
          <h3 className="font-semibold mb-2">Assignments</h3>
          {fields.map((assignment, index) => (
            <div key={assignment.id} className="border p-4 rounded-lg mb-4">
              <Controller
                name={`assignments.${index}.description`}
                control={control}
                rules={{ required: "Required" }}
                render={({ field }) => (
                  <Input
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
                    label="BTW"
                    defaultSelectedKeys={[field.value.toString()]}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value) as 6 | 12 | 21)
                    }
                    className="mb-2"
                  >
                    <SelectItem key="6">6%</SelectItem>
                    <SelectItem key="12">12%</SelectItem>
                    <SelectItem key="21">21%</SelectItem>
                  </Select>
                )}
              />
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onPress={() => insert(index + 1, assignment)}
                >
                  Copy
                </Button>
                <Button
                  variant="ghost"
                  color="danger"
                  onPress={() => remove(index)}
                  startContent={<TrashIcon className="h-5 w-5" />}
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
      >
        <ModalContent>
          <ModalHeader>Preview PDF</ModalHeader>
          <div className="flex items-center justify-center bg-transparent h-[80vh] overflow-y-auto">
            {user && selectedContact ? (
              <Card
                className="p-6 bg-white text-black shadow-2xl"
                style={{
                  width: "210mm",
                  minHeight: "297mm",
                  boxSizing: "border-box",
                }}
                id="preview-content"
              >
                <div className="mb-6">
                  <div className="w-full flex justify-between">
                    <Image
                      src={user.logo}
                      alt="Logo"
                      style={{
                        height: "60mm",
                        width: "auto",
                        marginBottom: "10mm",
                      }}
                    />
                  </div>
                  <div className="flex justify-between">
                    <div>
                      <h2
                        style={{
                          fontWeight: "bold",
                          textTransform: "uppercase",
                        }}
                      >
                        {user.name}
                      </h2>
                      <Text>{`${user.address.street} ${user.address.houseNumber}`}</Text>
                      <Text>{`${user.address.city}, ${user.address.country}`}</Text>
                      <Text>{`BTW nummer: ${user.btw}`}</Text>
                      <Text>{user.email}</Text>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <h2
                        style={{
                          fontWeight: "bold",
                          textTransform: "uppercase",
                        }}
                      >
                        {selectedContact.name}
                      </h2>
                      <Text>{`T.a.v. ${selectedContact.name}`}</Text>
                      <Text>{`${selectedContact.address.street} ${selectedContact.address.houseNumber}`}</Text>
                      <Text>{`${selectedContact.address.city}, ${selectedContact.address.country}`}</Text>
                      <Text>{`BTW nummer: ${selectedContact.btw}`}</Text>
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "center", marginBottom: "20mm" }}>
                  <h1
                    style={{
                      fontSize: "20pt",
                      fontWeight: "bold",
                      textTransform: "uppercase",
                    }}
                  >
                    Factuur
                  </h1>
                </div>

                <div style={{ width: "fit-content" }}>
                  <Tableish
                    data={{
                      Datum: format(new Date(), "dd/MM/yyyy", { locale: nl }),
                      "Te betalen voor": formValues.expirationDate,
                      Factuurnummer: formValues.billingNumber,
                    }}
                  />
                </div>

                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    marginBottom: "20mm",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        borderBottom: "1pt solid black",
                        borderTop: "1pt solid black",
                      }}
                    >
                      <th style={{ textAlign: "left", padding: "5mm 0" }}>
                        Omschrijving
                      </th>
                      <th style={{ textAlign: "right", padding: "5mm 0" }}>
                        Aantal
                      </th>
                      <th style={{ textAlign: "right", padding: "5mm 0" }}>
                        Eenheidsprijs
                      </th>
                      <th style={{ textAlign: "right", padding: "5mm 0" }}>
                        Subtotaal
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {formValues.assignments.map((a, index) => (
                      <tr
                        key={index}
                        style={{ borderBottom: "1pt solid #e0e0e0" }}
                      >
                        <td style={{ padding: "5mm 0" }}>{`${
                          a.description
                        } ${format(new Date(a.startDate), "dd/MM/yyyy", {
                          locale: nl,
                        })} - ${format(new Date(a.endDate), "dd/MM/yyyy", {
                          locale: nl,
                        })}`}</td>
                        <td style={{ textAlign: "right", padding: "5mm 0" }}>
                          {a.quantity}
                        </td>
                        <td style={{ textAlign: "right", padding: "5mm 0" }}>
                          {a.unitPrice.toFixed(2)}
                        </td>
                        <td style={{ textAlign: "right", padding: "5mm 0" }}>
                          {calculateSubtotal(a).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginBottom: "20mm", textAlign: "right" }}>
                  <Text>
                    <strong>Totaal exlc. BTW:</strong> €
                    {totalExclBtw.toFixed(2)}
                  </Text>
                  <Text>
                    <strong>BTW ({formValues.assignments[0]?.btw}%):</strong> €
                    {totalBtw.toFixed(2)}
                  </Text>
                  <Text>
                    <strong>Totaal inclusief BTW:</strong> €
                    {totalInclBtw.toFixed(2)}
                  </Text>
                </div>
                <div>
                  <h3
                    style={{ fontWeight: "bold", textTransform: "uppercase" }}
                  >
                    Betalingsinformatie
                  </h3>
                  <div style={{ width: "fit-content" }}>
                    <Tableish
                      data={{
                        IBAN: formatIban(user.iban),
                        Mededeling: formValues.structuredMessage,
                        "Te betalen voor": formValues.expirationDate,
                      }}
                    />
                  </div>
                  <div style={{ marginTop: "10mm" }}>
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
                  </div>
                </div>
              </Card>
            ) : (
              <Text>No user or selected contact found</Text>
            )}
          </div>
          <ModalFooter className="absolute bottom-0 m-10">
            <Button variant="flat" onPress={() => setIsPreviewOpen(false)}>
              Close
            </Button>
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
}: { children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) => (
  <div {...props} style={{ fontSize: "12pt", ...props.style }}>
    {children}
  </div>
);

const Tableish = ({ data }: { data: Record<string, string | number> }) => (
  <div
    style={{ display: "grid", gridTemplateColumns: "auto auto", gap: "2mm" }}
  >
    {Object.entries(data).map(([key, value]) => (
      <React.Fragment key={key}>
        <Text style={{ fontWeight: "bold", paddingRight: "5mm" }}>{key}</Text>
        <Text style={{ color: "#4a4a4a" }}>{value}</Text>
      </React.Fragment>
    ))}
  </div>
);
