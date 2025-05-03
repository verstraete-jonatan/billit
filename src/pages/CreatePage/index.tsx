import React, { useCallback, useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { nl } from "date-fns/locale";
// @ts-ignore
import html2pdf from "html2pdf.js";
import { format } from "date-fns";
import { QRCode } from "react-qrcode-logo";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  DocumentDuplicateIcon,
  PlusIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import { DatePicker } from "@mui/x-date-pickers";
import {
  Button,
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

// Placeholder for empty assignment (as per your original setup)
const emptyAssignment: Assignment = {
  description: "",
  startDate: new Date().toString(),
  endDate: new Date().toString(),
  quantity: 1,
  unitPrice: 0,
  btw: 21,
};

// Utility to generate unique bill ID
const generateBillId = () =>
  `BILL-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// Calculate totals
const calcSubtotal = (assignment: Assignment) =>
  assignment.quantity * assignment.unitPrice;

const calculateBtwAmount = (assignment: Assignment) =>
  calcSubtotal(assignment) * (assignment.btw / 100);

const totalWithBtw = (assignment: Assignment) =>
  calcSubtotal(assignment) + calculateBtwAmount(assignment);

// Format date utility
const formatDate = (d: string | Date) =>
  d ? format(new Date(d), "dd/MM/yyyy", { locale: nl }) : "-";

// TanStack Table column helper
const columnHelper = createColumnHelper<Assignment & { actions: void }>();

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
    watch,
    formState: { errors, isValid },
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

  const formValues = watch();
  const [isExporting, setExporting] = useState(false);

  const { fields, append, remove, insert } = useFieldArray<BillForm>({
    control,
    name: "assignments",
  });

  // Calculate totals for display
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
    setExporting(true);
    const element = document.getElementById("preview-content");

    const opt = {
      filename: `factuur-${formValues.billingNumber}.pdf`,
      image: { type: "png", quality: 1 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        windowWidth: 794,
        windowHeight: 1123,
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      },
      pagebreak: {
        mode: "avoid-all",
        before: "#preview-content",
      },
    };

    await html2pdf()
      .set(opt)
      .from(element)
      .toPdf()
      .get("pdf")
      .then((pdf: any) => {
        const totalPages = pdf.internal.getNumberOfPages();
        if (totalPages > 1) {
          for (let i = totalPages; i > 1; i--) {
            pdf.deletePage(i);
          }
        }
      })
      .save();
    setExporting(false);
  }, [formValues.billingNumber]);

  useEffect(() => {
    if (!user?.iban) {
      addToast({
        color: "danger",
        title:
          "We need your details for these bills. Please update your details in the sidebar first.",
      });
    }
  }, [user]);

  // TanStack Table columns
  const columns = useMemo(
    () => [
      columnHelper.accessor("description", {
        header: "Omschrijving",
        cell: ({ row }) => (
          <Controller
            name={`assignments.${row.index}.description`}
            control={control}
            rules={{ required: "Required" }}
            render={({ field }) => (
              <Input
                variant="flat"
                radius="sm"
                placeholder="..."
                isRequired
                value={field.value}
                onChange={field.onChange}
                className="bg-gray-800 text-white border-gray-600"
              />
            )}
          />
        ),
      }),
      columnHelper.accessor("quantity", {
        header: "Aantal",
        cell: ({ row }) => (
          <Controller
            name={`assignments.${row.index}.quantity`}
            control={control}
            rules={{ required: "Required", min: 1 }}
            render={({ field }) => (
              <Input
                variant="flat"
                radius="sm"
                isRequired
                type="number"
                value={field.value.toString()}
                onChange={(e) => field.onChange(parseInt(e.target.value))}
                className="bg-gray-800 text-white border-gray-600"
              />
            )}
          />
        ),
      }),
      columnHelper.accessor("unitPrice", {
        header: "Eenheidsprijs",
        cell: ({ row }) => (
          <Controller
            name={`assignments.${row.index}.unitPrice`}
            control={control}
            rules={{ required: "Required", min: 0 }}
            render={({ field }) => (
              <Input
                variant="flat"
                radius="sm"
                isRequired
                type="number"
                value={field.value.toString()}
                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                className="bg-gray-800 text-white border-gray-600"
              />
            )}
          />
        ),
      }),
      columnHelper.display({
        id: "subtotal",
        header: "Subtotaal",
        cell: ({ row }) => (
          <span>€{calcSubtotal(row.original).toFixed(2)}</span>
        ),
      }),
      columnHelper.accessor("btw", {
        header: "BTW",
        cell: ({ row }) => (
          <Controller
            name={`assignments.${row.index}.btw`}
            control={control}
            render={({ field }) => (
              <Select
                isRequired
                defaultSelectedKeys={[field.value.toString()]}
                radius="sm"
                className="bg-gray-800 text-white border-gray-600"
                onChange={(e) => field.onChange(parseInt(e.target.value))}
              >
                <SelectItem key="6">6%</SelectItem>
                <SelectItem key="12">12%</SelectItem>
                <SelectItem key="21">21%</SelectItem>
              </Select>
            )}
          />
        ),
      }),
      columnHelper.display({
        id: "total",
        header: "Totaal",
        cell: ({ row }) => (
          <span>€{totalWithBtw(row.original).toFixed(2)}</span>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              color="success"
              size="sm"
              onPress={() =>
                insert(
                  row.index + 1,
                  { ...row.original },
                  { shouldFocus: true }
                )
              }
              startContent={<DocumentDuplicateIcon className="h-4 w-4" />}
            >
              Copy
            </Button>
            <Button
              variant="ghost"
              color="danger"
              size="sm"
              onPress={() => fields.length && remove(row.index)}
              startContent={<TrashIcon className="h-4 w-4" />}
            >
              Remove
            </Button>
          </div>
        ),
      }),
    ],
    [control, fields, insert, remove]
  );

  const table = useReactTable({
    data: fields as unknown as (Assignment & { actions: void })[],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      {/* Left Side: Form and Table */}
      <div className="w-1/2 p-6 overflow-y-auto">
        <div className="flex justify-between mb-6">
          <h2 className="text-2xl font-bold">
            {isEditMode ? "Edit Bill" : "New Bill"}
          </h2>
          <div className="space-x-2">
            <Button
              variant="ghost"
              color="danger"
              onPress={() => navigate("/bills")}
              startContent={<XMarkIcon className="h-5 w-5" />}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={() => handleSubmit(onSave)()}
              startContent={<CheckIcon className="h-5 w-5" />}
              isDisabled={!isValid}
            >
              Save (Draft)
            </Button>
            <Button
              color="success"
              onPress={handleExport}
              startContent={<ArrowDownTrayIcon className="h-5 w-5" />}
              isLoading={isExporting}
              isDisabled={!isValid || !user || !selectedContact}
            >
              Export PDF
            </Button>
          </div>
        </div>

        {/* Form Inputs */}
        <div className="space-y-4 mb-6">
          <Controller
            name="contactId"
            control={control}
            rules={{ required: "Contact is required" }}
            render={({ field }) => (
              <Select
                isRequired
                label="Contact"
                placeholder="Select a contact"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                isInvalid={!!errors.contactId}
                errorMessage={errors.contactId?.message}
                className="bg-gray-800 text-white border-gray-600"
              >
                {contacts.map((contact) => (
                  <SelectItem key={contact.id}>{contact.name}</SelectItem>
                ))}
              </Select>
            )}
          />
          <div className="flex gap-4">
            <Controller
              name="expirationDate"
              control={control}
              rules={{ required: "Expiration date is required" }}
              render={({ field }) => (
                <DatePicker
                  label="Expiration Date"
                  value={field.value ? new Date(field.value) : null}
                  onChange={(value) => field.onChange(value?.toString())}
                  minDate={new Date()}
                  className="w-full"
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
              rules={{ required: "Billing number is required" }}
              render={({ field }) => (
                <Input
                  isRequired
                  label="Billing Number"
                  value={field.value}
                  onChange={field.onChange}
                  isInvalid={!!errors.billingNumber}
                  errorMessage={errors.billingNumber?.message}
                  className="bg-gray-800 text-white border-gray-600"
                />
              )}
            />
          </div>
          <Controller
            name="structuredMessage"
            control={control}
            rules={{
              required: "Structured message is required",
              validate: (value) => structuredMessage.validate(value),
            }}
            render={({ field }) => (
              <Input
                isRequired
                max={12 + 2 + 6}
                label="Structured Message"
                value={field.value}
                onChange={field.onChange}
                onBlur={structuredMessage.onBlur(field.onChange)}
                isInvalid={!!errors.structuredMessage}
                errorMessage={errors.structuredMessage?.message}
                className="bg-gray-800 text-white border-gray-600"
              />
            )}
          />
        </div>

        {/* Assignments Table */}
        <h3 className="text-lg font-semibold mb-4">Assignments</h3>
        <div className="rounded-lg shadow-lg border border-gray-700 bg-gray-900">
          <table className="w-full text-sm text-left text-gray-300">
            <thead className="text-xs uppercase bg-gray-800 text-gray-400">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-4 py-3">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-gray-700 hover:bg-gray-800 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Assignment Button */}
        <div className="flex justify-center mt-4">
          <Button
            variant="solid"
            color="primary"
            startContent={<PlusIcon className="h-5 w-5" />}
            onPress={() => append(emptyAssignment)}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Add Assignment
          </Button>
        </div>

        {/* Totals */}
        <div className="mt-6 p-4 rounded-lg bg-gray-800 shadow-lg">
          <h4 className="text-md font-semibold mb-2">Summary</h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>€{totalExclBtw.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>BTW:</span>
              <span>€{totalBtw.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>€{totalInclBtw.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Live Preview */}
      <div className="w-1/2 p-6 bg-gray-900 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Live Preview</h2>
        {user && selectedContact ? (
          <Card
            className="p-6 bg-white text-black shadow-2xl w-[210mm] h-[297mm] mx-auto"
            id="preview-content"
          >
            <div className="w-full flex justify-between items-end relative mb-5">
              <Image src={user.logo} alt="Logo" className="h-24 w-auto mb-5" />
              <div className="top-0 left-0 absolute flex items-center justify-center w-full h-full mr-3">
                <h1 className="text-3xl font-black uppercase">Factuur</h1>
              </div>
            </div>

            <div className="flex justify-between my-6">
              <TableishUser user={user} />
              <TableishUser user={selectedContact} />
            </div>

            <div className="w-fit mb-10">
              <Tableish
                data={{
                  Datum: format(new Date(), "dd/MM/yyyy", { locale: nl }),
                  "Te betalen voor": formatDate(formValues.expirationDate),
                  Factuurnummer: formValues.billingNumber,
                }}
              />
            </div>

            <table className="w-full border-collapse mb-6 rounded-lg shadow-lg border border-gray-300 bg-white">
              <thead>
                <tr className="border-b border-t border-gray-300 text-sm text-left bg-gray-100 text-gray-700 uppercase">
                  <th className="px-4 py-3">Omschrijving</th>
                  <th className="px-4 py-3">Aantal</th>
                  <th className="px-4 py-3">Eenheidsprijs</th>
                  <th className="px-4 py-3">Subtotaal</th>
                  <th className="px-4 py-3">BTW</th>
                  <th className="px-4 py-3">Totaal</th>
                </tr>
              </thead>
              <tbody>
                {formValues.assignments.map((a, index) => (
                  <tr
                    key={`row-${index}-${a.description}`}
                    className="border-b border-gray-200 text-sm font-medium font-mono hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">{a.description}</td>
                    <td className="px-4 py-3">{`${a.quantity} ${
                      a.unit ? `(${a.unit})` : ""
                    }`}</td>
                    <td className="px-4 py-3">{`€${a.unitPrice.toFixed(
                      2
                    )}`}</td>
                    <td className="px-4 py-3">{`€${calcSubtotal(a).toFixed(
                      2
                    )}`}</td>
                    <td className="px-4 py-3">{`${calculateBtwAmount(a).toFixed(
                      2
                    )} (${a.btw}%)`}</td>
                    <td className="px-4 py-3">{`€${totalWithBtw(a).toFixed(
                      2
                    )}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mb-6 flex justify-end w-full">
              <Totals
                rows={[
                  ["Subtotaal", totalExclBtw],
                  ["BTW", totalBtw],
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
                    "Te betalen voor": formatDate(formValues.expirationDate),
                  }}
                />
              </div>
            </div>

            <div className="text-grey text-sm w-full text-right">
              <p>Algemene voorwaarden:</p>
              <a href={user.voorWaardedenUrl} className="text-primary">
                {user.voorWaardedenUrl}
              </a>
            </div>
          </Card>
        ) : (
          <div className="text-gray-400">
            Please select a contact to see the preview.
          </div>
        )}
      </div>
    </div>
  );
};

// Helper components (Tableish, Totals, TableishUser) remain the same
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
        <React.Fragment key={key}>
          <div className="font-medium pr-2 text-sm">{key}:</div>
          <div className="text-[#111] text-sm">{value}</div>
        </React.Fragment>
      ))}
    </div>
  </div>
);

const Totals = ({ rows }: { rows: [string, number][] }) => (
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

const TableishUser = ({ user }: { user: User | Contact }) => {
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
};
