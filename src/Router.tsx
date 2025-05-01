import {
  DocumentPlusIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  QrCodeIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { Route, Routes, Navigate } from "react-router-dom";

import { ContactsPage } from "./pages/ContactsPage";
import { BillsOverview } from "./pages/BillsPage";
import { CreateBill } from "./pages/CreatePage";
import { QrPage } from "./pages/QrPage";
import { Help } from "./pages/Help";

export const navItems = [
  {
    name: "Create",
    path: "/create",
    icon: DocumentPlusIcon,
  },
  {
    name: "Bills",
    path: "/bills",
    icon: ClipboardDocumentListIcon,
  },
  {
    name: "Contacts",
    path: "/contacts",
    icon: UserGroupIcon,
  },
  {
    name: "QR",
    path: "/qr",
    icon: QrCodeIcon,
  },
  {
    name: "Help",
    path: "/help",
    icon: InformationCircleIcon,
  },
];

export const AppRoutes = () => (
  <Routes>
    <Route path="/create/:bill_id?" element={<CreateBill />} />
    <Route path="/bills" element={<BillsOverview />} />
    <Route path="/contacts" element={<ContactsPage />} />
    <Route path="/qr" element={<QrPage />} />
    <Route path="/help" element={<Help />} />

    <Route path="/" element={<Navigate to="/create" />} />
    <Route path="/billit" element={<Navigate to="/create" />} />
  </Routes>
);
