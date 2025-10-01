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
  // PDF → Excel (demo only)
  // -------------------------
  if (type === "pdf2excel") {
    alert("⚠️ PDF → Excel mbola mila parser toy ny pdf.js. Demo ihany izao.");
  }

  // -------------------------
  // PDF → Word (demo only)
  // -------------------------
  if (type === "pdf2word") {
    alert("⚠️ PDF → Word mbola mila pdf-lib na pdf.js + docx.js. Demo ihany izao.");
  }
}
