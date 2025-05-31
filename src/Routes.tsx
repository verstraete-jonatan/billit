import {
  DocumentPlusIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  QrCodeIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

import { Navigate, Routes, Route } from "react-router";

import { ContactsPage } from "./pages/Contacts/ContactsPage";
import { BillsOverview } from "./pages/BillsOverview/BillsOverview";
import { CreateBill } from "./pages/CreatePage/CreatePage";
import { CustomQr } from "./pages/CustomQR/CustomQr";
import { Help } from "./pages/Help/Help";
import { Home } from "./pages/Home";

export type AppType = "create" | "bills" | "contacts" | "qr" | "help" | "home";
export type AppRoute = `/${AppType}`;
export type AppPath = `${"/" | ""}${AppRoute}${`/${string}` | ""}`;

export const navItems: Array<{
  name: string;
  path: AppRoute;
  icon: typeof InformationCircleIcon;
}> = [
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
    name: "Custom QR",
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
    <Route path={"/create/:bill_id?"} element={<CreateBill />} />
    <Route path={"/bills"} element={<BillsOverview />} />
    <Route path={"/contacts"} element={<ContactsPage />} />
    <Route path={"/qr"} element={<CustomQr />} />
    <Route path={"/help"} element={<Help />} />
    <Route path={"/home"} element={<Home />} />

    <Route path="*" element={<Navigate to="/home" />} />
  </Routes>
);
