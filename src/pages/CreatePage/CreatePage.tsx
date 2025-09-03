import React, {
  useCallback,
  useMemo,
  useState,
  useEffect,
  useRef,
  Fragment,
  memo,
} from "react";
import { useParams } from "react-router";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { nl } from "date-fns/locale";

import { endOfMonth, format } from "date-fns";
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
import { emptyUser, useUserStore } from "../../store/userStore";
import { formatBtwNumber, formatIban, useBeforeLeave } from "../../helpers";

import { Theme } from "src/themes";
import { export2PDF } from "./helpers";
import { StyledQrCode } from "src/components/StyledQrCode";
import { BookmarkSquareIcon } from "@heroicons/react/24/outline";
import { useImagine } from "src/utils/useImagine";

const now = new Date();

// Placeholder for empty assignment
const emptyAssignment: Assignment = {
  description: "",
  startDate: now.toString(),
  endDate: now.toString(),
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

  const contacts = useContacts();
  const { user } = useUserStore();
  const { updateBill, bills } = useBillStore();
  const { images } = useImagine();

  const billId = useRef(generateBillId());
  const existingBill = useMemo(
    () => bills.find((bill) => bill.id === bill_id),
    []
  );

  const {
    control,
    handleSubmit,
    watch,
    setFocus,
    formState: { errors, isValid, isDirty },
    reset,
  } = useForm<Bill>({
    mode: "onChange",
    shouldFocusError: true,
    defaultValues: {
      contact: existingBill?.contact,
      expirationDate: existingBill?.expirationDate || "",
      billingNumber: existingBill?.billingNumber || "",
      structuredMessage:
        (existingBill?.structuredMessage ?? user?.structuredMessage) || "",
      assignments: existingBill?.assignments || [emptyAssignment],
      status: existingBill?.status ?? "DRAFT",
      id: existingBill?.id ?? billId.current,
      date: existingBill?.date ?? endOfMonth(now).toString(),
    } satisfies BillForm,
  });

  const formValues = watch();
  const { fields, append, remove, insert } = useFieldArray<Bill>({
    control,
    name: "assignments",
  });

  useBeforeLeave(isDirty, () => onSave(false));

  const onError = useCallback(() => {
    try {
      const errs = [...Object.values(errors)].find(Boolean);
      const firstErr = Array.isArray(errs) ? errs.find(Boolean) : errs;
      const ref =
        "ref" in firstErr
          ? firstErr.ref
          : (Object.values(firstErr)[0] as any)?.ref;

      if (ref) {
        if ("onfocus" in ref) {
          ref.onFocus();
        } else if ("name" in ref) {
          setFocus(name as any, { shouldSelect: true });
        }
      }
      // console.log({ ref });
    } catch (e) {
      console.info(e);
    }
  }, [errors, setFocus]);

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
  const selectedContact = formValues.contact
    ? contacts.find((c) => c.email === formValues.contact.email)
    : undefined;

  const onSave = useCallback(
    (verboseAndNav = true): boolean => {
      if (isExporting) {
        return false;
      }
      if (!user || !selectedContact || !isValid) {
        verboseAndNav &&
          addToast({
            color: "danger",
            title: "No user or missing details.",
          });
        return false;
      }

      try {
        updateBill({
          ...formValues,
          // contact: { ...selectedContact },
        });
        reset(undefined, { keepValues: true });
      } catch (error: any) {
        addToast({
          color: "danger",
          title: error.message ?? "Failed to save bill",
        });
      }

      return true;
      // verboseAndNav && navigate("/bills");
    },
    [billId, user, selectedContact, isValid, formValues, isExporting]
  );

  const handleExport = useCallback(async () => {
    setIsEditing(false);
    setExporting(true);
    // required for screenshot/print-pfd
    document.getElementById("bill-content")?.scrollTo({ top: 0 });

    setTimeout(async () => {
      try {
        await export2PDF(formValues.billingNumber);
      } catch (error: any) {
        addToast({
          color: "danger",
          title: error.message ?? "Failed to export bill",
        });
        console.error(error);
      }
      setExporting(false);
    }, 500);

    onSave(true);
  }, [formValues.billingNumber, onSave]);

  const onSubmit = useCallback(
    (fn: () => any = handleExport) =>
      () =>
        handleSubmit(fn, onError)(),
    [onError, handleExport]
  );

  useEffect(() => {
    if (!user?.iban) {
      addToast({
        color: "danger",
        title:
          "We need your details for these bills. Please update your details in the sidebar first.",
      });
    }
  }, [!!user]);

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
                onChange={(e) => field.onChange(parseFloat(e.target.value))}
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
        cell: ({ row }) => {
          const quantity = watch(`assignments.${row.index}.quantity`);
          const unitPrice = watch(`assignments.${row.index}.unitPrice`);
          return (
            <span>€{calcSubtotal({ unitPrice, quantity }).toFixed(2)}</span>
          );
        },
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
                label="btw"
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
        cell: ({ row }) => {
          const quantity = watch(`assignments.${row.index}.quantity`);
          const unitPrice = watch(`assignments.${row.index}.unitPrice`);
          const btw = watch(`assignments.${row.index}.btw`);

          return (
            <span>
              €{totalWithBtw({ unitPrice, quantity, btw }).toFixed(2)}
            </span>
          );
        },
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

  const isDarkMode = isEditing ? user.darkMode : false;

  if (!user?.iban || !user?.name) {
    return (
      <div className="text-gray-400 text-center pt-10">
        Please update your user details first before creating a bill.
        <p>Required fields: "iban", "name"</p>
      </div>
    );
  }

  return (
    <Theme>
      <div className="h-screen p-6 flex justify-between ">
        <div className="flex-1 flex justify-center">
          <Card
            id="bill-content"
            className={`m-0 w-fit h-[calc(100vh - 5rem)] rounded-none! ${
              isDarkMode ? "bg-black text-white" : "bg-white text-black"
            } ${isEditing ? "overflow-y-auto" : ""}`}
          >
            <Theme isDarkMode={isDarkMode}>
              <div
                className={`p-6 ${isEditing ? "w-[280mm]" : "w-[210mm]"}`}
                style={{
                  transform: "scale(0.9) translateY(-50px)",
                  // scale: 0.9,
                }}
              >
                {/* Header */}
                <div className="w-full flex justify-between items-end relative mb-5">
                  {/* <div className="max-w-[200px] overflow-hidden mb-5 h-24 flex items-center justify-center"> */}
                  <Image
                    src={images["logo"] || undefined}
                    alt="Logo"
                    className="w-auto mb-5 h-24"
                    // className="h-full w-auto mb-5 h-24 "
                  />
                  {/* </div> */}
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
                        name="contact"
                        control={control}
                        rules={{ required: "Contact is required" }}
                        render={({ field }) => (
                          <Select
                            {...field}
                            value={field.value?.email ?? ""}
                            defaultSelectedKeys={[field.value?.email ?? ""]}
                            isRequired
                            label="Contact"
                            placeholder="Select a contact"
                            // value={field.value}
                            onChange={(e) =>
                              field.onChange(
                                contacts.find((i) => i.email === e.target.value)
                              )
                            }
                            isInvalid={!!errors.contact}
                            errorMessage={errors.contact?.message}
                            disallowEmptySelection
                          >
                            {contacts.map((contact) => (
                              <SelectItem key={contact.email}>
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
                        {isEditing ? (
                          <Controller
                            name="date"
                            control={control}
                            rules={{ required: "Date is required" }}
                            render={({ field }) => (
                              <DatePicker
                                defaultValue={now}
                                ref={field.ref}
                                value={
                                  field.value ? new Date(field.value) : null
                                }
                                onChange={(value) =>
                                  field.onChange(value?.toString())
                                }
                                // minDate={now}
                                className="w-full"
                                slotProps={{
                                  textField: {
                                    error: !!errors.date,
                                    helperText: errors.date?.message,
                                  },
                                }}
                              />
                            )}
                          />
                        ) : (
                          formatDate(formValues.date)
                        )}
                      </div>
                      {(!!formValues.expirationDate || isEditing) && (
                        <div className="font-medium pr-2 text-sm">
                          Te betalen voor:
                        </div>
                      )}

                      {isEditing ? (
                        <Controller
                          name="expirationDate"
                          control={control}
                          render={({ field }) => (
                            <DatePicker
                              // {...field}

                              defaultValue={now}
                              ref={field.ref}
                              value={field.value ? new Date(field.value) : null}
                              onChange={(value) =>
                                field.onChange(value?.toString())
                              }
                              minDate={now}
                              className="w-full"
                            />
                          )}
                        />
                      ) : (
                        formatDate(formValues.expirationDate)
                      )}

                      <div className="font-medium pr-2 text-sm">
                        Factuurnummer:
                      </div>
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

                      {/* {(isEditing || formValues.structuredMessage) && (
                      <div className="font-medium pr-2 text-sm">
                        Structurele mededeling:
                      </div>
                    )}
                    {isEditing ? (
                      <>
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
                                onBlur={validationMessage.onBlur(
                                  field.onChange
                                )}
                                isInvalid={!!errors.structuredMessage}
                                errorMessage={errors.structuredMessage?.message}
                              />
                            )}
                          />
                        </div>
                      </>
                    ) : (
                      formValues.structuredMessage || ""
                    )} */}
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
                          <td className="px-4 py-3">{`€${calcSubtotal(
                            a
                          ).toFixed(2)}`}</td>
                          <td className="px-4 py-3">{`${calculateBtwAmount(
                            a
                          ).toFixed(2)} (${a.btw}%)`}</td>
                          <td className="px-4 py-3">{`€${totalWithBtw(
                            a
                          ).toFixed(2)}`}</td>
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
                    <div className="flex items-end flex-1">
                      <div className="mt-4 flex h-fit">
                        <div className="relative">
                          <StyledQrCode
                            amount={totalInclBtw}
                            message={formValues.structuredMessage}
                            size={120}
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
                            <div className="font-medium pr-2 text-sm">
                              IBAN:
                            </div>
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

                      <div className="text-grey text-sm w-full text-right text-gray-900">
                        <p>Algemene voorwaarden:</p>
                        <a href={user.voorwaardedenUrl}>
                          {user.voorwaardedenUrl}
                        </a>
                      </div>
                    </div>
                  </Fragment>
                )}
              </div>
            </Theme>
          </Card>
        </div>

        {/* Action bar */}
        <div className="flex flex-col justify-between mb-4">
          <div className="space-x-2">
            <h2 className="text-2xl font-bold">
              Bill {formValues.date ? " - " + formatDate(formValues.date) : ""}
            </h2>
            <div className="flex flex-col gap-1 *:rounded-md">
              <Button
                color="primary"
                onPress={onSubmit(() => onSave(false))}
                isDisabled={!isDirty}
                isLoading={isExporting}
                startContent={<BookmarkSquareIcon className="h-auto w-5" />}
                preventFocusOnPress
              >
                Save
              </Button>

              <Button
                color="primary"
                variant="bordered"
                onPress={() => setIsEditing(!isEditing)}
                isDisabled={isExporting}
                startContent={
                  isEditing ? (
                    <EyeIcon className="h-auto w-5" />
                  ) : (
                    <PencilIcon className="h-auto w-5" />
                  )
                }
              >
                {isEditing ? "Preview" : "Edit"}
              </Button>

              <Button
                color="success"
                onPress={onSubmit(handleExport)}
                startContent={<ArrowDownTrayIcon className="h-auto w-5" />}
                isLoading={isExporting}
                preventFocusOnPress
                isDisabled={!isValid && !isEditing}
              >
                Export PDF
              </Button>
              {!isEditing && !isValid && (
                <p className="text-xs italic text-[#f33] py-2">
                  Can't export - some details are missing
                </p>
              )}
            </div>
          </div>
          {/* <div className="italic text-xs font-mono text-center mt-2">
            {isEditing
              ? "Changes are saved automatically"
              : " True size display A4 (210mm x 297mm)"}
          </div> */}
        </div>
      </div>
    </Theme>
  );
};

// Helper components (TableishUser, Totals)
const TableishUser = memo(({ user = emptyUser }: { user?: User | Contact }) => {
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
});

const Totals = memo(({ rows }: { rows: [string, number][] }) => (
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
));

// Utility to generate unique bill ID
const generateBillId = () =>
  btoa(Date.now().toString(10) + Math.random().toString());

// Calculate totals
const calcSubtotal = (
  assignment: Assignment | Pick<Assignment, "quantity" | "unitPrice">
) => assignment.quantity * assignment.unitPrice;

const calculateBtwAmount = (
  assignment: Assignment | Pick<Assignment, "quantity" | "unitPrice" | "btw">
) => calcSubtotal(assignment) * (assignment.btw / 100);

const totalWithBtw = (
  assignment: Assignment | Pick<Assignment, "quantity" | "unitPrice" | "btw">
) => calcSubtotal(assignment) + calculateBtwAmount(assignment);

// Format date utility
const formatDate = (d?: string | Date) =>
  d ? format(new Date(d), "dd/MM/yyyy", { locale: nl }) : "";
