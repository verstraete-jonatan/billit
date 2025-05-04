import {
  DocumentPlusIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  QrCodeIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

import { Navigate, Routes, Route } from "react-router";

import { ContactsPage } from "./pages/Contacts";
import { BillsOverview } from "./pages/BillsPage";
import { CreateBill } from "./pages/CreatePage";
import { QrPage } from "./pages/QrPage";
import { Help } from "./pages/Help";

export const navItems = [
  {
    name: "Create",
    path: "billit/create",
    icon: DocumentPlusIcon,
  },
  {
    name: "Bills",
    path: "billit/bills",
    icon: ClipboardDocumentListIcon,
  },
  {
    name: "Contacts",
    path: "billit/contacts",
    icon: UserGroupIcon,
  },
  {
    name: "QR",
    path: "billit/qr",
    icon: QrCodeIcon,
  },
  {
    name: "Help",
    path: "billit/help",
    icon: InformationCircleIcon,
  },
];

export const AppRoutes = () => (
  <Routes>
    <Route path="billit/create/:bill_id?" element={<CreateBill />} />
    <Route path="billit/bills" element={<BillsOverview />} />
    <Route path="billit/contacts" element={<ContactsPage />} />
    <Route path="billit/qr" element={<QrPage />} />
    <Route path="billit/help" element={<Help />} />

    <Route path="/" element={<Navigate to="/billit/create" />} />
    <Route path="/billit" element={<Navigate to="/billit/create" />} />
  </Routes>
);
