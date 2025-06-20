import { Card, CardBody, CardHeader } from "@heroui/react";
import { ReactNode } from "react";

const infos: [string, string | ReactNode][] = [
  [
    "Export",
    `go to "Create". Fill in all details. Press "Preview". Press "Export PDF".`,
  ],
  [
    "Edit my details like IBAN or voorwaarden url",
    `Bottom sidebar: click 'edit my info'`,
  ],
];

export const Help = () => {
  return (
    <div className="p-10 m-10 ">
      {infos.map(([k, v]) => (
        <Card key={k} className="p-5 shadow-xl mb-2 text-sm">
          <CardHeader className="font-black">{k}</CardHeader>
          <CardBody className="text-grey">{v}</CardBody>
        </Card>
      ))}
      <p style={{ fontSize: 8, color: "white" }}>versioning: {0.14}</p>
    </div>
  );
};
