import React, {
  useCallback,
  useState,
  useEffect,
  ChangeEvent,
  Suspense,
  ReactNode,
  Fragment,
  useRef,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import html2canvas from "html2canvas-pro";
import { DatePicker } from "@mui/x-date-pickers";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  // ModalBody,
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
import { jsPDF } from "jspdf";
import { dummy_bills } from "src/store/_dummy";

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
    reset,
    watch,
    formState: { errors, isValid },
    trigger,
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
          <div
            className="flexs item-center justify-center bg-transparent"
            style={{
              // transform: "scale(0.8)",
              transformOrigin: `${window.innerWidth / 2} ${
                window.innerHeight / 2
              }`,
            }}
          >
            <div className="w-fill overflow-y-scroll w-full h-full">
              {user && selectedContact ? (
                <Card
                  className="p-6 bg-white text-black shadow-2xl w-[210mm] h-[297mm] mx-auto"
                  id="preview-content"
                >
                  <div className="mb-6">
                    <div className="w-full flex justify-between">
                      <Image
                        src={user.logo}
                        alt="Logo"
                        className="h-24 w-auto mb-5"
                      />
                    </div>
                    <div className="flex justify-between">
                      <div>
                        <h2 className="font-bold uppercase">{user.name}</h2>
                        <Text>{`${user.address.street} ${user.address.houseNumber}`}</Text>
                        <Text>{`${user.address.city}, ${user.address.country}`}</Text>
                        <Text>{`BTW nummer: ${user.btw}`}</Text>
                        <Text>{user.email}</Text>
                      </div>
                      <div className="text-right">
                        <h2 className="font-bold uppercase">
                          {selectedContact.name}
                        </h2>
                        <Text>{`T.a.v. ${selectedContact.name}`}</Text>
                        <Text>{`${selectedContact.address.street} ${selectedContact.address.houseNumber}`}</Text>
                        <Text>{`${selectedContact.address.city}, ${selectedContact.address.country}`}</Text>
                        <Text>{`BTW nummer: ${selectedContact.btw}`}</Text>
                      </div>
                    </div>
                  </div>
                  <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold uppercase">Factuur</h1>
                  </div>

                  <div className="w-fit">
                    <Tableish
                      data={{
                        Datum: format(new Date(), "dd/MM/yyyy", { locale: nl }),
                        "Te betalen voor": formValues.expirationDate,
                        Factuurnummer: formValues.billingNumber,
                      }}
                    />
                  </div>

                  <table className="w-full border-collapse mb-6">
                    <thead>
                      <tr className="border-b border-t border-black">
                        <th className="text-left py-2">Omschrijving</th>
                        <th className="text-right py-2">Aantal</th>
                        <th className="text-right py-2">Eenheidsprijs</th>
                        <th className="text-right py-2">Subtotaal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formValues.assignments.map((a, index) => (
                        <tr key={index} className="border-b border-gray-200">
                          <td className="py-2">{`${a.description} ${format(
                            new Date(a.startDate),
                            "dd/MM/yyyy",
                            { locale: nl }
                          )} - ${format(new Date(a.endDate), "dd/MM/yyyy", {
                            locale: nl,
                          })}`}</td>
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
                  <div className="mb-6 text-right">
                    <Text>
                      <strong>Totaal exlc. BTW:</strong> €
                      {totalExclBtw.toFixed(2)}
                    </Text>
                    <Text>
                      <strong>BTW ({formValues.assignments[0]?.btw}%):</strong>{" "}
                      €{totalBtw.toFixed(2)}
                    </Text>
                    <Text>
                      <strong>Totaal inclusief BTW:</strong> €
                      {totalInclBtw.toFixed(2)}
                    </Text>
                  </div>
                  <div>
                    <h3 className="font-semibold uppercase">
                      Betalingsinformatie
                    </h3>

                    <div className="w-fit">
                      <Tableish
                        data={{
                          IBAN: formatIban(user.iban),
                          Mededeling: formValues.structuredMessage,
                          "Te betalen voor": formValues.expirationDate,
                        }}
                      />
                    </div>

                    <div className="mt-4">
                      {/* <Suspense
                        fallback={
                          <Text>
                            Can't generate QR code. Some details are incorrect
                          </Text>
                        }
                      > */}
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

                        // quietZone={10}
                      />
                      {/* </Suspense> */}
                    </div>
                  </div>
                </Card>
              ) : (
                <Text>No user or selected contact found</Text>
              )}
            </div>
          </div>
          {/* </ModalBody> */}
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
  <div className="grid grid-cols-2 gap-1">
    {Object.entries(data).map(([key, value]) => (
      <Fragment key={key}>
        <Text className="text-lg font-bold pr-2">{key}</Text>
        <Text className="text-gray-600">{value}</Text>
      </Fragment>
    ))}
  </div>
);

// Utility to generate unique bill ID
const generateBillId = () =>
  `BILL-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// Utility to generate QR code data in EU/Belgian SEPA format
const _generateQRCodeData = (
  iban: string,
  structuredMessage: string,
  amount: number,
  businessName: string
) => {
  return `BCD\n001\n1\nSCT\n\n${businessName}\n${iban}\nEUR${amount.toFixed(
    2
  )}\n\n\n${structuredMessage}`;
};

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

  validate: (input: string) =>
    [11, 12].includes(input.replace(/[^\d]/g, "").length) || "Incorrect format",
  onBlur:
    (onChange: (e: ChangeEvent<HTMLInputElement>) => void) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      let value = event.target.value.replaceAll(/\D/g, "");
      value = value.replace(/^([0-9]{1,3})/, "$1/");
      if (value.length >= 7) {
        value = value.replace(/([0-9]{4})$/, "/$1");
      }
      // modify event value
      event.target.value = `+++${value}+++`;
      onChange(event);
    },
};

const formatIban = (iban: string) => {
  const [country] = iban.split(/\d+/);
  return `${country} ${iban.replace(/\D/g, "")}`;
};

const onExport = async (billingNumber: string | number) => {
  const elm = document.querySelector("#preview-content") as HTMLElement;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  await doc.html(elm, {
    callback: (pdf) => {
      pdf.save(`factuur-${billingNumber}.pdf`);
    },
    x: 0,
    y: 0,
    width: 210, // A4 width in mm
    windowWidth: elm.offsetWidth, // Match the element's width
    html2canvas: {
      scale: 2, // Increase resolution
    },
  });

  // const elm = document.querySelector("#preview-content") as HTMLElement;
  // await html2canvas(elm)
  //   .then(function (canvas) {
  //     // const imgData = canvas.toDataURL("image/jpeg", 1.0);

  //     let width = canvas.width;
  //     let height = canvas.height;

  //     console.log(canvas, width, height);

  //     const pdf = new jsPDF({
  //       orientation: "p",
  //       unit: "pt",
  //       format: "a4",
  //       // format: [height, width]
  //     });
  //     //then we get the dimensions from the 'pdf' file itself
  //     width = pdf.internal.pageSize.getWidth();
  //     height = pdf.internal.pageSize.getHeight();
  //     pdf.addImage(canvas, "PNG", 0, 0, width, height);
  //     pdf.save(`factuur-${formValues.billingNumber}.pdf`);
  //   })
  //   .catch((e) => window.alert("uups" + e));
};
