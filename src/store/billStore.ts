import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface BillState {
  bills: Bill[];
  addBill: (bill: Bill) => void;
  updateBillStatus: (id: string, status: Bill["status"]) => void;
  deleteBill: (id: string) => void;
  updateBill: (bill: Bill) => void;
}

export const useBillStore = create<BillState>()(
  persist(
    (set, get) => ({
      bills: [],
      addBill: (bill) => {
        throw new Error("Depricated, use updateBill");
        set((state) => ({ bills: [...state.bills, bill] }));
      },
      updateBillStatus: (id, status) => {
        set((state) => ({
          bills: state.bills.map((bill) =>
            bill.id === id ? { ...bill, status } : bill
          ),
        }));
      },
      updateBill: (updatedBill: Bill) => {
        set((state) => {
          if (!state.bills.some(({ id }) => id === updatedBill.id)) {
            return { bills: [...state.bills, updatedBill] };
          }
          return {
            bills: state.bills.map((bill) =>
              bill.id === updatedBill.id ? { ...bill, ...updatedBill } : bill
            ),
          };
        });
      },
      deleteBill: (id) => {
        set((state) => ({
          bills: state.bills.filter((bill) => bill.id !== id),
        }));
      },
    }),
    {
      name: "bill-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export const useBills = () => useBillStore(({ bills }) => bills);
export const useAddBill = () => useBillStore((state) => state.addBill);
export const useUpdateBillStatus = () =>
  useBillStore((state) => state.updateBillStatus);
export const useDeleteBill = () => useBillStore((state) => state.deleteBill);
