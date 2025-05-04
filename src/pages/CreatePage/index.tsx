import React, {
  useCallback,
  useMemo,
  useState,
  useEffect,
  useRef,
  Fragment,
} from "react";
import {
  useBeforeUnload,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { nl } from "date-fns/locale";

import { format } from "date-fns";
import { QRCode } from "react-qrcode-logo";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  PlusIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  PencilIcon,
  EyeIcon,
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
  validationMessage,
} from "src/helpers";
import { ThemeProvider } from "@mui/material";

import { darkTheme, lightTheme } from "src/themes";
import { exportToPdf } from "./helpers";

// Placeholder for empty assignment
const emptyAssignment: Assignment = {
  description: "",
  startDate: new Date().toString(),
  endDate: new Date().toString(),
  quantity: 1,
  unitPrice: 0,
  btw: 21,
};

// TanStack Table column helper
const columnHelper = createColumnHelper<Assignment & { actions: void }>();

export const CreateBill: React.FC = () => {
  const [isEditing, setIsEditing] = useState(true);
  const [isExporting, setExporting] = useState(false);

  const { bill_id } = useParams<{ bill_id: string }>();
  const navigate = useNavigate();

  const contacts = useContacts();
  const { user } = useUserStore();
  const { settings: qrCodeSettings } = useQrStore();
  const { updateBill, bills } = useBillStore();

  const existingBill = bills.find((bill) => bill.id === bill_id);

  const billId = useRef(bill_id || generateBillId()).current;

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid, isDirty },
  } = useForm<BillForm>({
    mode: "onChange",
    shouldFocusError: true,
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
  const { fields, append, remove, insert } = useFieldArray<BillForm>({
    control,
    name: "assignments",
  });

  useBeforeUnload(() => {
    console.log("olalla");
    // onSave();
  });

  const onSubmit = (fn: () => any) => () => handleSubmit(fn, onError)();

  const onError = useCallback(() => {
    try {
      const errs = [...Object.values(errors)].find(Boolean);
      const firstErr = Array.isArray(errs) ? errs.find(Boolean) : errs;
      const ref =
        "ref" in firstErr
          ? firstErr.ref
          : (Object.values(firstErr)[0] as any)?.ref;

      console.log("ONERR", ref, firstErr);

      ref?.focus();
    } catch (e) {
      console.info(e);
    }
  }, [errors]);

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

  const onSave = useCallback(
    (verboseAndNav = true) => {
      if (!user || !selectedContact || !isValid) {
        verboseAndNav &&
          addToast({
            color: "danger",
            title: "No user or missing details.",
          });
        return;
      }

      const billData: Bill = {
        id: billId,
        user,
        contact: { ...selectedContact },
        status: "DRAFT",
        expirationDate: formValues.expirationDate,
        billingNumber: formValues.billingNumber,
        structuredMessage: formValues.structuredMessage,
        assignments: formValues.assignments,
      };
      updateBill(billData);
      // verboseAndNav && navigate("/bills");
    },
    [billId]
  );

  const handleExport = useCallback(async () => {
    if (!isValid) {
      addToast({
        color: "danger",
        title: "No user or missing details.",
      });
      return;
    }
    onSave(true);
    setExporting(true);
    try {
      await exportToPdf(formValues.billingNumber);
    } catch (error: any) {
      console.error(error);
      window.alert("Reload page - " + error.message);
    }
    setExporting(false);
  }, [formValues.billingNumber, isValid]);

  useEffect(() => {
    if (!user?.iban) {
      addToast({
        color: "danger",
        title:
          "We need your details for these bills. Please update your details in the sidebar first.",
      });
    }
  }, [user]);

  useEffect(() => {
    console.log("saving");
    return () => {
      onSave(false);
    };
  }, [onSave]);

  // TanStack Table columns for edit mode
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
                {...field}
                key={`assignments.${row.index}.description`}
                variant="flat"
                radius="sm"
                placeholder="description..."
                isInvalid={!!errors.assignments?.[row.index]?.description}
                errorMessage={
                  errors.assignments?.[row.index]?.description?.message
                }
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
                onChange={(e) => field.onChange(parseInt(e.target.value))}
                className="w-[100px]"
                disallowEmptySelection
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
              color="danger"
              size="sm"
              onPress={() => remove(row.index)}
              startContent={<TrashIcon className="h-4 w-4" />}
              disabled={!fields.length}
              isIconOnly
            />
          </div>
        ),
      }),
    ],
    [control, fields, insert, remove, errors]
  );

  const table = useReactTable({
    data: fields as unknown as (Assignment & { actions: void })[],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const og_width = ` ${isEditing ? "w-2/3" : "w-[210mm]"}`;
  const isDarkMode = false && isEditing;

  if (!user?.iban || !user?.name) {
    return (
      <div className="text-gray-400 text-center pt-10">
        Please update your user details first before creating a bill.
        <p>Required fields: "iban", "name"</p>
      </div>
    );
  }

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <main className={`${isDarkMode ? "dark" : "light"}`}>
        <div className="h-screen p-6 flex flex-col items-center">
          {/* Action Buttons */}
          <div className={"w-[210mm] flex justify-between mb-4"}>
            <h2 className="text-2xl font-bold text-white">
              {isDarkMode ? "Edit Bill" : "New Bill"}
            </h2>
            <div className="space-x-2">
              <Button
                color={isEditing ? "primary" : "secondary"}
                onPress={() => setIsEditing(!isEditing)}
                startContent={
                  isEditing ? (
                    <EyeIcon className="h-5 w-5" />
                  ) : (
                    <PencilIcon className="h-5 w-5" />
                  )
                }
              >
                {isEditing ? "Preview" : "Edit"}
              </Button>
              <Button
                color="success"
                onPress={onSubmit(handleExport)}
                startContent={<ArrowDownTrayIcon className="h-5 w-5" />}
                isLoading={isExporting}
                preventFocusOnPress
                isDisabled={!isValid && !isEditing}
              >
                Export PDF
              </Button>
            </div>
          </div>

          <Card
            className={`shadow-2xl h-[297mm] overflow-scroll p-6 shadow-[#102] ${
              isDarkMode ? "bg-black text-white" : "bg-white text-black"
            } ${og_width}`}
            id="bill-content"
          >
            {/* Header */}
            <div className="w-full flex justify-between items-end relative mb-5">
              <Image src={user.logo} alt="Logo" className="h-24 w-auto mb-5" />
              <div className="top-0 left-0 absolute flex items-center justify-center w-full h-full mr-3">
                <h1 className="text-3xl font-black uppercase">Factuur</h1>
              </div>
            </div>

            {/* User and Contact Info */}
            <div className="flex justify-between my-6">
              <TableishUser user={user} />
              <div className="w-[300px]">
                {isEditing ? (
                  <Controller
                    name="contactId"
                    control={control}
                    rules={{ required: "Contact is required" }}
                    render={({ field }) => (
                      <Select
                        {...field}
                        isRequired
                        label="Contact"
                        placeholder="Select a contact"
                        // value={field.value}
                        // onChange={(e) => field.onChange(e.target.value)}
                        isInvalid={!!errors.contactId}
                        errorMessage={errors.contactId?.message}
                        disallowEmptySelection
                      >
                        {contacts.map((contact) => (
                          <SelectItem key={contact.id}>
                            {contact.name}
                          </SelectItem>
                        ))}
                      </Select>
                    )}
                  />
                ) : (
                  <TableishUser user={selectedContact} />
                )}
              </div>
            </div>

            {/* Bill Details */}
            <div className="w-fit mb-10">
              <div className="min-w-[300px]">
                <div className="grid grid-cols-2 gap-0.5">
                  <div className="font-medium pr-2 text-sm">Datum:</div>
                  <div
                    className={`text-sm ${
                      isDarkMode ? "text-white" : "text-[#111]"
                    }`}
                  >
                    {format(new Date(), "dd/MM/yyyy", { locale: nl })}
                  </div>
                  <div className="font-medium pr-2 text-sm">
                    Te betalen voor:
                  </div>
                  <div>
                    {isEditing ? (
                      <Controller
                        name="expirationDate"
                        control={control}
                        rules={{ required: "Expiration date is required" }}
                        render={({ field }) => (
                          <DatePicker
                            // {...field}
                            ref={field.ref}
                            value={field.value ? new Date(field.value) : null}
                            onChange={(value) =>
                              field.onChange(value?.toString())
                            }
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
                    ) : (
                      formatDate(formValues.expirationDate)
                    )}
                  </div>
                  <div className="font-medium pr-2 text-sm">Factuurnummer:</div>
                  <div
                    className={`text-sm ${
                      isDarkMode ? "text-white" : "text-[#111]"
                    }`}
                  >
                    {isEditing ? (
                      <Controller
                        name="billingNumber"
                        control={control}
                        rules={{
                          required: "Billing number is required",
                        }}
                        render={({ field }) => (
                          <Input
                            isRequired
                            value={field.value}
                            onChange={field.onChange}
                            isInvalid={!!errors.billingNumber}
                            errorMessage={errors.billingNumber?.message}
                          />
                        )}
                      />
                    ) : (
                      formValues.billingNumber
                    )}
                  </div>

                  {isEditing && (
                    <>
                      <div className="font-medium pr-2 text-sm">
                        Structurele mededeling
                      </div>
                      <div
                        className={`text-sm ${
                          isEditing ? "text-white" : "text-[#111]"
                        }`}
                      >
                        <Controller
                          name="structuredMessage"
                          control={control}
                          rules={{
                            required: "Required",
                            validate: validationMessage.validate,
                          }}
                          render={({ field }) => (
                            <Input
                              isRequired
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={validationMessage.onBlur(field.onChange)}
                              isInvalid={!!errors.structuredMessage}
                              errorMessage={errors.structuredMessage?.message}
                            />
                          )}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Assignments Table */}
            {isEditing ? (
              <>
                <table
                  className={`w-full border-collapse mb-6 rounded-lg shadow-lg border border-gray-300 ${
                    isDarkMode ? "bg-black" : "bg-white"
                  }`}
                >
                  <thead>
                    <tr
                      className={`border-b border-t  text-sm text-left  uppercase ${
                        isDarkMode
                          ? "bg-gray-900 text-gray-100 border-gray-800"
                          : "bg-gray-100 text-gray-700 border-gray-300"
                      }`}
                    >
                      {table.getHeaderGroups().map((headerGroup) => (
                        <React.Fragment key={headerGroup.id}>
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
                        </React.Fragment>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        className={`border-b transition-colors ${
                          isDarkMode
                            ? "border-gray-900 hover:bg-gray-900"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
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
                <div className="flex justify-center mb-6">
                  <Button
                    variant="solid"
                    color="primary"
                    startContent={<PlusIcon className="h-5 w-5" />}
                    onPress={() => append(emptyAssignment)}
                    size="lg"
                  >
                    Add Assignment
                  </Button>
                </div>
              </>
            ) : (
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
                      <td className="px-4 py-3">{`${calculateBtwAmount(
                        a
                      ).toFixed(2)} (${a.btw}%)`}</td>
                      <td className="px-4 py-3">{`€${totalWithBtw(a).toFixed(
                        2
                      )}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {!isEditing && (
              <Fragment>
                {/* Totals */}
                <div className="mb-6 flex justify-end w-full">
                  <Totals
                    rows={[
                      ["Subtotaal", totalExclBtw],
                      ["BTW", totalBtw],
                      ["Totaal", totalInclBtw],
                    ]}
                  />
                </div>
                {/* Payment Info and QR Code */}
                <div className="flex items-end h-full">
                  <div className="mt-4 flex h-fit">
                    <div className="relative">
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
                        // {...qrCodeSettings}
                        // logoPadding={0}
                      />

                      {/* {isEditing && (
                        <div className="absolute top-[35%] left-0 bg-[#ffffff33] backdrop-blur shadow text-center py-1 w-full opacity-90">
                          Modify{" "}
                          <a href="#qr" className="link">
                            QR page
                          </a>
                        </div>
                      )} */}
                    </div>

                    <div className="min-w-[300px]">
                      <div className="font-black">Betalingsinformatie</div>
                      <hr className="mb-2" />
                      <div className="grid grid-cols-2 gap-0.5">
                        <div className="font-medium pr-2 text-sm">IBAN:</div>
                        <div
                          className={`text-sm ${
                            isDarkMode ? "text-white" : "text-[#111]"
                          }`}
                        >
                          {formatIban(user.iban)}
                        </div>
                        <div className="font-medium pr-2 text-sm">
                          Mededeling:
                        </div>
                        <div
                          className={`text-sm ${
                            isDarkMode ? "text-white" : "text-[#111]"
                          }`}
                        >
                          {formValues.structuredMessage}
                        </div>
                        <div className="font-medium pr-2 text-sm">
                          Te betalen voor:
                        </div>
                        <div
                          className={`text-sm ${
                            isDarkMode ? "text-white" : "text-[#111]"
                          }`}
                        >
                          {formatDate(formValues.expirationDate)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Footer */}
                <div className="text-grey text-sm w-full text-right text-gray-900">
                  <p>Algemene voorwaarden:</p>
                  <a href={user.voorwaardedenUrl}>{user.voorwaardedenUrl}</a>
                </div>
              </Fragment>
            )}
          </Card>
          <div className="italic text-white text-xs font-mono text-center mt-2">
            {isEditing
              ? "Changes are saved automatically"
              : " True size display A4 (210mm x 297mm)"}
          </div>
        </div>
      </main>
    </ThemeProvider>
  );
};

// Helper components (TableishUser, Totals)
const TableishUser = ({ user }: { user?: User | Contact }) => {
  user =
    user ??
    ({
      logo: "",
      voorwaardedenUrl: "",
      structuredMessage: "",
      id: "",
      name: "",
      address: {
        street: "",
        houseNumber: "",
        city: "",
        country: "",
      },
      btw: "",
      iban: "",
      settings: {},
    } satisfies User);

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
      <hr className="mb-2" />
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
          ** Some details are "undefined" double check them **
        </div>
      )}
    </div>
  );
};

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

// Utility to generate unique bill ID
const generateBillId = () =>
  `${Date.now()}${Math.random().toString(36).slice(2, 9)}`
    .split("")
    .sort(() => Math.random())
    .join("");

// Calculate totals
const calcSubtotal = (assignment: Assignment) =>
  assignment.quantity * assignment.unitPrice;

const calculateBtwAmount = (assignment: Assignment) =>
  calcSubtotal(assignment) * (assignment.btw / 100);

const totalWithBtw = (assignment: Assignment) =>
  calcSubtotal(assignment) + calculateBtwAmount(assignment);

// Format date utility
const formatDate = (d?: string | Date) =>
  d ? format(new Date(d), "dd/MM/yyyy", { locale: nl }) : "-";
