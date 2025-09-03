import React, { useState, useCallback, memo } from "react";
import { useNavigate } from "react-router";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import { PlusIcon, MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import {
  useBills,
  useDeleteBill,
  useUpdateBillStatus,
} from "../../store/billStore";
import { Theme } from "src/themes";
import { useNav } from "src/utils/useNav";

type BillStatus = "DRAFT" | "PENDING" | "PAYED";

const statusColors: Record<BillStatus, string> = {
  DRAFT: "text-gray-500 bg-gray-100",
  PENDING: "text-orange-500 bg-orange-100",
  PAYED: "text-green-500 bg-green-100",
};

export const BillsOverview: React.FC = memo(() => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [billToDelete, setBillToDelete] = useState<string | null>(null);

  const bills = useBills();
  const nav = useNav();
  const deleteBill = useDeleteBill();
  const updateBillStatus = useUpdateBillStatus();

  const filteredBills = bills.filter(
    (bill) =>
      bill.billingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.contact.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteClick = useCallback((billId: string) => {
    setBillToDelete(billId);
    setShowConfirmation(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (billToDelete) {
      deleteBill(billToDelete);
      setBillToDelete(null);
      setShowConfirmation(false);
    }
  }, [billToDelete, deleteBill]);

  const cancelDelete = useCallback(() => {
    setBillToDelete(null);
    setShowConfirmation(false);
  }, []);

  const getStatusAction = useCallback(
    (bill: { id: string; status: BillStatus }) => {
      switch (bill.status) {
        case "DRAFT":
          return (
            <Button
              size="sm"
              variant="ghost"
              color="warning"
              className="w-[100px]"
              onPress={() => updateBillStatus(bill.id, "PENDING")}
            >
              mark Pending
            </Button>
          );
        case "PENDING":
          return (
            <Button
              size="sm"
              variant="ghost"
              color="success"
              className="w-[100px]"
              onPress={() => updateBillStatus(bill.id, "PAYED")}
            >
              mark Payed
            </Button>
          );
        case "PAYED":
          return (
            <Button
              size="sm"
              variant="ghost"
              className="w-[100px]"
              onPress={() => updateBillStatus(bill.id, "DRAFT")}
            >
              mark Draft
            </Button>
          );
        default:
          return null;
      }
    },
    [updateBillStatus]
  );

  return (
    <Theme>
      <div className="flex flex-col p-5">
        <div className="flex items-center justify-between mb-5 px-6 py-4">
          <h1 className="text-2xl font-bold">Bills overview</h1>
          <Button
            variant="solid"
            color="primary"
            startContent={<PlusIcon className="h-5 w-5" />}
            onPress={() => nav("/create")}
          >
            Create Bill
          </Button>
        </div>

        <Input
          placeholder="Search bills by number or contact"
          startContent={
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          }
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
          className="mb-5 max-w-md"
        />

        <Table
          aria-label="Bills table with sorting"
          sortDescriptor={{
            column: "billingNumber",
            direction: "ascending",
          }}
          classNames={{
            table: "min-w-full",
            wrapper: "rounded-lg",
          }}
        >
          <TableHeader>
            <TableColumn key="billingNumber" allowsSorting>
              Bill Number
            </TableColumn>
            <TableColumn key="contact.name" allowsSorting>
              Contact Name
            </TableColumn>
            <TableColumn key="status" allowsSorting>
              Status
            </TableColumn>
            <TableColumn key="expirationDate" allowsSorting>
              Expiration Date
            </TableColumn>
            <TableColumn>Actions</TableColumn>
          </TableHeader>
          <TableBody items={filteredBills}>
            {(bill) => (
              <TableRow key={bill.id}>
                <TableCell>{bill.billingNumber}</TableCell>
                <TableCell>{bill.contact.name}</TableCell>
                <TableCell>
                  <span
                    className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                      statusColors[bill.status]
                    }`}
                  >
                    {bill.status}
                  </span>
                </TableCell>
                <TableCell>{bill.expirationDate}</TableCell>
                <TableCell className="flex gap-2">
                  {getStatusAction(bill)}
                  <Button
                    size="sm"
                    variant="ghost"
                    color="primary"
                    isDisabled={bill.status !== "DRAFT"}
                    onPress={() => nav(`/create/${bill.id}`)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    color="danger"
                    onPress={() => handleDeleteClick(bill.id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <Modal isOpen={showConfirmation} onClose={cancelDelete} size="sm">
          <ModalContent>
            <ModalHeader>Confirm Deletion</ModalHeader>
            <ModalBody>
              <p>Are you sure you want to delete this bill?</p>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={cancelDelete}>
                Cancel
              </Button>
              <Button color="danger" onPress={confirmDelete}>
                Delete
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </Theme>
  );
});
