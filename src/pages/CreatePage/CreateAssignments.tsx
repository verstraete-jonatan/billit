import React, { useCallback, useState, useEffect, Fragment, memo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useForm,
  useFieldArray,
  Controller,
  FieldArrayWithId,
  Control,
} from "react-hook-form";
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

export const CreateBill = ({
  control,
}: {
  control: Control<BillForm, any, BillForm>;
  fields: FieldArrayWithId<BillForm>[];
}) => {
  const { fields, append, remove, insert } = useFieldArray<BillForm>({
    control,
    name: "assignments",
  });

  return (
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
                render={({ field }) => (
                  <Input
                    isRequired
                    className="flex-5"
                    label="Description"
                    value={field.value}
                    onChange={field.onChange}
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
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
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
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
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
                    onChange={(value) => field.onChange(value?.toString())}
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
                    onChange={(value) => field.onChange(value?.toString())}
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
  );
};

// const AssFields: {isD}
// const Assignment = ({assignment}:{assignment: Assignment})=> {
// }
