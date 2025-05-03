import {
  useFieldArray,
  Controller,
  Control,
  UseFieldArrayReturn,
} from "react-hook-form";

import { PlusIcon } from "@heroicons/react/20/solid";
import { DatePicker } from "@mui/x-date-pickers";
import { Button, Input, Select, SelectItem } from "@heroui/react";

import { emptyAssignment } from "./helpers";
import { XCircleIcon } from "@heroicons/react/24/outline";

export const Assignments = ({
  control,
  fields: { fields, append, remove, insert },
}: {
  fields: UseFieldArrayReturn<BillForm>;
  control: Control<BillForm, any, BillForm>;
}) => {
  const onDuplicate = (index: number, assignment: Assignment) => () => {
    console.log(assignment);
    insert(index + 1, { ...assignment }, { shouldFocus: true });
  };

  const onRemove = (index: number) => () => {
    fields.length && remove(index);
  };

  return (
    <div className="overflow-y-auto max-h-[90vh]">
      <h2 className="font-semibold my-2">Assignments</h2>
      <table className="w-full border-collapse mb-6">
        <thead>
          <tr className="border-b border-t border-black text-sm text-left">
            <th>Description</th>
            <th>Amount</th>
            <th>Unit price €</th>
            <th>btw</th>
            <th>Start date</th>
            <th>End date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((assignment, index) => (
            <tr
              key={`assignment-${index}-${assignment.id}`}
              className="border-b border-gray-200 text-sm font-medium font-mono bg-default-100 *:w-[80px]"
            >
              <td className="!w-[30%]">
                <Controller
                  name={`assignments.${index}.description`}
                  control={control}
                  rules={{ required: "Required" }}
                  render={({ field }) => (
                    <Input
                      // variant="flat"
                      radius="none"
                      placeholder="..."
                      isRequired
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
                      variant="flat"
                      radius="none"
                      isRequired
                      type="number"
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
                      variant="flat"
                      radius="none"
                      isRequired
                      type="number"
                      value={field.value.toString()}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value))
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
                      defaultSelectedKeys={[field.value.toString()]}
                      radius="none"
                    >
                      <SelectItem key="6">6%</SelectItem>
                      <SelectItem key="12">12%</SelectItem>
                      <SelectItem key="21">21%</SelectItem>
                    </Select>
                  )}
                />
              </td>
              <td>
                <Controller
                  name={`assignments.${index}.startDate`}
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      // minDate={new Date()}
                      value={field.value ? new Date(field.value) : null}
                      onChange={(value) => field.onChange(value?.toString())}
                      className="h-[42px] overflow-hidden outline-white"
                    />
                  )}
                />
              </td>
              <td>
                <Controller
                  name={`assignments.${index}.endDate`}
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value ? new Date(field.value) : null}
                      onChange={(value) => field.onChange(value?.toString())}
                      className="h-[42px] overflow-hidden outline-white"
                    />
                  )}
                />
              </td>
              <td>
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    color="success"
                    radius="none"
                    onPress={onDuplicate(index, assignment)}
                  >
                    Copy
                  </Button>
                  <Button
                    radius="none"
                    color="warning"
                    onPress={onRemove(index)}
                    isIconOnly
                  >
                    Remove
                    <XCircleIcon />
                  </Button>
                </div>
              </td>
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
  );
};
