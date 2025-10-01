async function convertFile() {
  const fileInput = document.getElementById("fileInput").files[0];
  const type = document.getElementById("conversionType").value;
  const link = document.getElementById("downloadLink");

  if (!fileInput) {
    alert("Mba misafidiana fichier azafady !");
    return;
  }

  // -------------------------
  // Excel → Word
  // -------------------------
  if (type === "excel2word") {
    const data = await fileInput.arrayBuffer();
    const workbook = XLSX.read(data, {type:"array"});
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const sheetData = XLSX.utils.sheet_to_csv(firstSheet);

    const { Document, Packer, Paragraph } = docx;
    const doc = new Document({
      sections: [{ properties:{}, children: [new Paragraph(sheetData)] }]
    });

    const blob = await Packer.toBlob(doc);
    link.href = URL.createObjectURL(blob);
    link.download = "output.docx";
    link.style.display = "block";
  }

  // -------------------------
  // PDF → Word
  // -------------------------
  if (type === "pdf2word") {
    const pdfData = new Uint8Array(await fileInput.arrayBuffer());
    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;

    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      fullText += textContent.items.map(item => item.str).join(" ") + "\n\n";
    }

    const { Document, Packer, Paragraph } = docx;
    const doc = new Document({
      sections: [{ properties:{}, children: [new Paragraph(fullText)] }]
    });

    const blob = await Packer.toBlob(doc);
    link.href = URL.createObjectURL(blob);
    link.download = "output.docx";
    link.style.display = "block";
  }

  // -------------------------
  // PDF → Excel
  // -------------------------
  if (type === "pdf2excel") {
    const pdfData = new Uint8Array(await fileInput.arrayBuffer());
    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;

    let rows = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const line = textContent.items.map(item => item.str).join(" ");
      rows.push([line]);
    }

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "PDFtoExcel");

    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });

    link.href = URL.createObjectURL(blob);
    link.download = "output.xlsx";
    link.style.display = "block";
  }
}
