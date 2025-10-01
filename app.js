const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const filePreview = document.getElementById("filePreview");
const fileNameEl = document.getElementById("fileName");
const pdfCanvas = document.getElementById("pdfPreview");
let selectedFile = null;

// ---- Drag & Drop ----
dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("dragover");
});
dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("dragover");
});
dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("dragover");
  if (e.dataTransfer.files.length > 0) {
    handleFile(e.dataTransfer.files[0]);
  }
});
fileInput.addEventListener("change", () => {
  if (fileInput.files.length > 0) {
    handleFile(fileInput.files[0]);
  }
});

// ---- Gestion fichier ----
async function handleFile(file) {
  selectedFile = file;
  filePreview.style.display = "block";
  fileNameEl.textContent = file.name;

  // Raha PDF → aseho pejy voalohany
  if (file.type === "application/pdf") {
    const pdfData = new Uint8Array(await file.arrayBuffer());
    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 0.5 });
    const context = pdfCanvas.getContext("2d");

    pdfCanvas.height = viewport.height;
    pdfCanvas.width = viewport.width;
    pdfCanvas.style.display = "block";

    await page.render({ canvasContext: context, viewport: viewport }).promise;
  } else {
    pdfCanvas.style.display = "none";
  }
}

// ---- Conversion ----
async function convertFile() {
  const type = document.getElementById("conversionType").value;
  const link = document.getElementById("downloadLink");

  if (!selectedFile) {
    alert("Mba safidio aloha ny fichier !");
    return;
  }

  // Excel → Word
  if (type === "excel2word") {
    const data = await selectedFile.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array" });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const sheetData = XLSX.utils.sheet_to_csv(firstSheet);

    const { Document, Packer, Paragraph } = window.docx;
    const doc = new Document({
      sections: [{ children: [new Paragraph(sheetData)] }]
    });

    const blob = await Packer.toBlob(doc);
    link.href = URL.createObjectURL(blob);
    link.download = "output.docx";
    link.style.display = "block";
  }

  // PDF → Word
  if (type === "pdf2word") {
    const pdfData = new Uint8Array(await selectedFile.arrayBuffer());
    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      fullText += textContent.items.map(item => item.str).join(" ") + "\n\n";
    }

    const { Document, Packer, Paragraph } = window.docx;
    const doc = new Document({
      sections: [{ children: [new Paragraph(fullText)] }]
    });

    const blob = await Packer.toBlob(doc);
    link.href = URL.createObjectURL(blob);
    link.download = "output.docx";
    link.style.display = "block";
  }

  // PDF → Excel
  if (type === "pdf2excel") {
    const pdfData = new Uint8Array(await selectedFile.arrayBuffer());
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
