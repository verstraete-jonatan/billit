import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
} from "../store/billStore";

type BillStatus = "DRAFT" | "PENDING" | "PAYED";

const statusColors: Record<BillStatus, string> = {
  DRAFT: "text-gray-500 bg-gray-100",
  PENDING: "text-orange-500 bg-orange-100",
  PAYED: "text-green-500 bg-green-100",
};

export const BillsOverview: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [billToDelete, setBillToDelete] = useState<string | null>(null);

  const bills = useBills();
  const navigate = useNavigate();
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

  const getStatusAction = (bill: { id: string; status: BillStatus }) => {
    switch (bill.status) {
      case "DRAFT":
        return (
          <Button
            size="sm"
            variant="ghost"
            onPress={() => updateBillStatus(bill.id, "PENDING")}
          >
            Mark as Pending
          </Button>
        );
      case "PENDING":
        return (
          <Button
            size="sm"
            variant="ghost"
            onPress={() => updateBillStatus(bill.id, "PAYED")}
          >
            Mark as Payed
          </Button>
        );
      case "PAYED":
        return (
          <Button
            size="sm"
            variant="ghost"
            onPress={() => updateBillStatus(bill.id, "PENDING")}
          >
            Revert
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex items-center justify-between px-6 py-4">
        <h2>Bills</h2>
        <Button
          variant="solid"
          color="primary"
          startContent={<PlusIcon className="h-5 w-5" />}
          onClick={() => navigate("/create")}
        >
          Create Bill
        </Button>
      </div>

      <div className="flex-1 p-6">
        <Input
          placeholder="Search bills by number or contact"
          startContent={
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          }
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-6 max-w-md"
        />

        <Table
          aria-label="Bills table with sorting"
          sortDescriptor={{
            column: "billingNumber",
            direction: "ascending",
          }}
          classNames={{
            table: "min-w-full",
            wrapper: "rounded-lg border border-gray-200",
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
                    color="danger"
                    onClick={() => handleDeleteClick(bill.id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Modal isOpen={showConfirmation} onClose={cancelDelete} size="sm">
        <ModalContent>
          <ModalHeader>Confirm Deletion</ModalHeader>
          <ModalBody>
            <p>Are you sure you want to delete this bill?</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onClick={cancelDelete}>
              Cancel
            </Button>
            <Button color="danger" onClick={confirmDelete}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};
