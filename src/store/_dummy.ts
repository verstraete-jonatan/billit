export const dummy_contacts: Contact[] = [
  {
    id: "contact_001",
    name: "TechSolutions BV",
    address: {
      street: "Avenue Louise",
      houseNumber: "123",
      city: "Brussels",
      country: "Belgium",
      postalCode: "900",
    },
    btw: "BE0123456789",
    email: "",
  },
  {
    id: "contact_002",
    name: "GreenEnergy Co",
    address: {
      street: "Rue de la Loi",
      houseNumber: "45",
      city: "Antwerp",
      country: "Belgium",
      postalCode: "900",
    },
    btw: "BE0987654321",
    email: "",
  },
  {
    id: "contact_003",
    name: "CreativeDesigns SRL",
    address: {
      street: "Chaussée de Wavre",
      houseNumber: "78",
      city: "Ghent",
      country: "Belgium",
      postalCode: "900",
    },
    btw: "BE0567891234",
  },
];

export const dummy_user: User = {
  name: "FreelancePro",
  address: {
    street: "Boulevard Anspach",
    houseNumber: "10",
    city: "Brussels",
    country: "Belgium",
    postalCode: "900",
  },
  btw: "BE0456789123",
  email: "contact@freelancepro.be",
  iban: "BE68539000703456",
  logo: "null",
  id: "-1",
};

export const dummy_bills: Bill[] = [
  {
    user: { ...dummy_user },
    contact: { ...dummy_contacts[0] }, // TechSolutions BV
    status: "DRAFT",
    expirationDate: "2025-05-15",
    billingNumber: "INV-2025-001",
    id: "bill_001",
    assignments: [
      {
        description: "Website Development",
        startDate: "2025-04-01",
        endDate: "2025-04-30",
        quantity: 40, // 40 hours
        unitPrice: 75, // €75/hour
        btw: 21, // 21% VAT
      },
    ],
    // structuredMessage: "+++001/2025/00001+++",
    structuredMessage: "001/2025/00001",
  },
  {
    user: dummy_user,
    contact: dummy_contacts[1], // GreenEnergy Co
    status: "PENDING",
    expirationDate: "2025-06-01",
    billingNumber: "INV-2025-002",
    id: "bill_002",
    assignments: [
      {
        description: "Energy Audit Consulting",
        startDate: "2025-04-15",
        endDate: "2025-04-20",
        quantity: 10, // 10 hours
        unitPrice: 120, // €120/hour
        btw: 12, // 12% VAT
      },
    ],
    structuredMessage: "+++002/2025/00002+++",
  },
  {
    user: dummy_user,
    contact: dummy_contacts[2], // CreativeDesigns SRL
    status: "PAYED",
    expirationDate: "2025-04-30",
    billingNumber: "INV-2025-003",
    id: "bill_003",
    assignments: [
      {
        description: "Branding and Logo Design",
        startDate: "2025-03-01",
        endDate: "2025-03-15",
        quantity: 15, // 15 hours
        unitPrice: 90, // €90/hour
        btw: 6, // 6% VAT
      },
    ],
  },
];
