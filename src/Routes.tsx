import {
  DocumentPlusIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  QrCodeIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

import { Navigate, Routes, Route } from "react-router";

import { ContactsPage } from "./pages/Contacts/ContactsPage";
import { BillsOverview } from "./pages/BillsOverview";
import { CreateBill } from "./pages/CreatePage/CreatePage";
import { CustomQr } from "./pages/CustomQR/CustomQr";
import { Help } from "./pages/Help/Help";

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
    name: "Custom QR",
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
    <Route path="billit/qr" element={<CustomQr />} />
    <Route path="billit/help" element={<Help />} />

    <Route path="/" element={<Navigate to="/billit/create" />} />
    <Route path="/billit" element={<Navigate to="/billit/create" />} />
  </Routes>
);
