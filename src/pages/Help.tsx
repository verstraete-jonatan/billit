const infos: [string, string][] = [
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
    <div className="p-10 m-10">
      {infos.map(([k, v]) => (
        <div className="mb-10">
          <h3 className="font-black">{k}:</h3>
          <div className="text-grey italic">{v}</div>
        </div>
      ))}
    </div>
  );
};
