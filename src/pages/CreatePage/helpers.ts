// @ts-ignore
import html2pdf from "html2pdf.js";

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
export const exportToPdf = async (billingNumber: string) => {
  const element = document.getElementById("bill-content");

  if (!element) {
    window.alert('Opps, contact dev. Message: no element "bill-content" found');
    return;
  }

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
    .from(element)
    .toPdf()
    .get("pdf")
    // .then((pdf: any) => {
    //   const totalPages = pdf.internal.getNumberOfPages();
    //   if (totalPages > 1) {
    //     for (let i = totalPages; i > 1; i--) {
    //       pdf.deletePage(i);
    //     }
    //   }
    // })
    .then((pdf: any) => {
      // Get total pages and iterate in reverse order
      const totalPages = pdf.internal.getNumberOfPages();
      Array.from({ length: totalPages }, (_, i) => totalPages - i).forEach(
        (pageNum) => {
          pdf.setPage(pageNum);
          const pageData = pdf.internal.getCurrentPageInfo();
          const pageContent = pageData.pageContext?.text || [];
          const hasContent = pageContent.length > 0;
          const hasImages = pageData.pageContext?.images?.length > 0;
          const isEmpty = !hasContent && !hasImages;

          if (isEmpty) {
            pdf.deletePage(pageNum);
          }
        }
      );

      // Ensure at least one page remains
      if (pdf.internal.getNumberOfPages() === 0) {
        pdf.addPage();
      }
    })
    .save();
};
