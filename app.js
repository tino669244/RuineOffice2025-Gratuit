const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const editorBox = document.getElementById("editorBox");
const textEditor = document.getElementById("textEditor");

let fileContent = "";

// --- Drag & Drop Upload ---
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
  if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
});

fileInput.addEventListener("change", () => {
  if (fileInput.files.length > 0) handleFile(fileInput.files[0]);
});

// --- Lire fichier ---
async function handleFile(file) {
  const reader = new FileReader();

  if (file.type === "application/pdf") {
    const pdfData = new Uint8Array(await file.arrayBuffer());
    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
    let text = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      text += textContent.items.map(item => item.str).join(" ") + "\n\n";
    }

    fileContent = text;
    textEditor.value = text;
    editorBox.style.display = "block";
  }
  else if (file.type.includes("excel")) {
    reader.onload = function(e) {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const csv = XLSX.utils.sheet_to_csv(firstSheet);
      fileContent = csv;
      textEditor.value = csv;
      editorBox.style.display = "block";
    };
    reader.readAsArrayBuffer(file);
  }
  else if (file.type.includes("word") || file.name.endsWith(".docx")) {
    alert("Lecture Word simplifiée : texte brut seulement");
    reader.onload = function(e) {
      fileContent = e.target.result;
      textEditor.value = e.target.result;
      editorBox.style.display = "block";
    };
    reader.readAsText(file);
  }
  else {
    reader.onload = function(e) {
      fileContent = e.target.result;
      textEditor.value = e.target.result;
      editorBox.style.display = "block";
    };
    reader.readAsText(file);
  }
}

// --- Convertir & Télécharger ---
async function convertAndDownload() {
  const type = document.getElementById("conversionType").value;
  const content = textEditor.value;

  if (type === "word") {
    const { Document, Packer, Paragraph } = window.docx;
    const doc = new Document({
      sections: [{ children: [new Paragraph(content)] }]
    });

    const blob = await Packer.toBlob(doc);
    downloadBlob(blob, "output.docx");
  }
  else if (type === "excel") {
    const rows = content.split("\n").map(r => r.split(","));
    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    downloadBlob(blob, "output.xlsx");
  }
  else if (type === "pdf") {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const lines = content.split("\n");
    let y = 10;
    lines.forEach(line => {
      doc.text(line, 10, y);
      y += 10;
      if (y > 280) { // page pleine
        doc.addPage();
        y = 10;
      }
    });
    doc.save("output.pdf");
  }
}

// --- Download helper ---
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
