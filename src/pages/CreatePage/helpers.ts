import reactToPdf, { type Options as ReactPdfOptions } from "react-to-pdf";

export const now = new Date().toString();
export const emptyAssignment: Assignment = {
  description: "",
  startDate: now,
  endDate: now,
  quantity: 1,
  unitPrice: 0,
  btw: 21,
};

// Update the PDF generation logic
export const export2PDF = async (billingNumber: string) => {
  const element = () => document.getElementById("bill-content");

  const options: ReactPdfOptions = {
    filename: `factuur-${billingNumber}.pdf`,
    // default is `save`
    method: "save",
    // default is Resolution.MEDIUM = 3, which should be enough, higher values
    // increases the image quality but also the size of the PDF, so be careful
    // using values higher than 10 when having multiple pages generated, it
    // might cause the page to crash or hang.
    resolution: 3,
    page: {
      // margin is in MM, default is Margin.NONE = 0
      margin: 0,
      // default is 'A4'
      format: "A4",
      // default is 'portrait'
      // orientation: "landscape",
    },
    canvas: {
      // default is 'image/jpeg' for better size performance
      mimeType: "image/png",
      qualityRatio: 1,
    },
    // Customize any value passed to the jsPDF instance and html2canvas
    // function. You probably will not need this and things can break,
    // so use with caution.
    overrides: {
      // see https://artskydj.github.io/jsPDF/docs/jsPDF.html for more options
      pdf: {
        compress: true,
      },
      // see https://html2canvas.hertzen.com/configuration for more options
      canvas: {
        useCORS: true,
        // windowWidth: 1588, // 210mm at 96 DPI * 2
        // windowHeight: 2246, // 297mm at 96 DPI * 2
      },
    },
  };

  await reactToPdf(element, options);
};
