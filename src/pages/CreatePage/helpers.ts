// @ts-ignore
import html2pdf from "html2pdf.js";
import { formatRgb } from "culori";

export const now = new Date().toString();
export const emptyAssignment: Assignment = {
  description: "",
  startDate: now,
  endDate: now,
  quantity: 1,
  unitPrice: 0,
  btw: 21,
};

// Function to convert OKLCH to HEX
const oklchToHex = (color: string): string => {
  try {
    if (color.startsWith("oklch")) {
      const parsed = formatRgb(color);
      return parsed || color; // Fallback to original color if conversion fails
    }
    return color;
  } catch {
    console.log("Color conversion failed", { color });
    return color; // Fallback to original color on error
  }
};

// Function to recursively convert OKLCH colors in styles to HEX for a given element
const convertStylesToHex = (element: HTMLElement) => {
  // Process the current element's styles
  const computedStyles = window.getComputedStyle(element);
  const inlineStyles: Record<string, string> = {};

  for (const prop of computedStyles) {
    const value = computedStyles.getPropertyValue(prop);
    if (value.includes("oklch")) {
      const hexColor = oklchToHex(value);
      inlineStyles[prop] = hexColor;
    }
  }

  // Apply converted styles as inline styles
  for (const [prop, value] of Object.entries(inlineStyles)) {
    element.style.setProperty(prop, value);
  }

  // Recursively process child elements
  element.childNodes.forEach((child) => {
    if (child.nodeType === Node.ELEMENT_NODE) {
      convertStylesToHex(child as HTMLElement);
    }
  });
};

// Update the PDF generation logic
export const exportToPdf = async (billingNumber: string) => {
  const element = document.getElementById("bill-content");

  if (!element) {
    window.alert('Opps, contact dev. Message: no element "bill-content" found');
    return;
  }
  // Create a clone of the element to avoid modifying the original DOM
  const clonedElement = element.cloneNode(true) as HTMLElement;
  document.body.appendChild(clonedElement);

  // Convert OKLCH colors to HEX for the cloned element
  convertStylesToHex(clonedElement);

  const opt = {
    filename: `factuur-${billingNumber}.pdf`,
    image: { type: "png", quality: 1 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      windowWidth: 794,
      windowHeight: 1123,
    },
    jsPDF: {
      unit: "mm",
      format: "a4",
      orientation: "portrait",
    },
    pagebreak: {
      mode: "avoid-all",
      before: "#bill-content",
    },
  };

  await html2pdf()
    .set(opt)
    .from(clonedElement)
    .toPdf()
    .get("pdf")
    .then((pdf: any) => {
      const totalPages = pdf.internal.getNumberOfPages();
      if (totalPages > 1) {
        for (let i = totalPages; i > 1; i--) {
          pdf.deletePage(i);
        }
      }
    })
    .save();

  // Clean up the cloned element
  document.body.removeChild(clonedElement);
};
