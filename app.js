async function convertFile() {
  const fileInput = document.getElementById("fileInput").files[0];
  const type = document.getElementById("conversionType").value;
  const link = document.getElementById("downloadLink");

  if (!fileInput) {
    alert("Mba misafidiana fichier azafady !");
    return;
  }

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

  if (type === "pdf2excel") {
    alert("Demo: mila pdf.js ho an'ny tena parsing an'ny table PDF"); 
  }

  if (type === "pdf2word") {
    alert("Demo: mila pdf-lib na pdf.js + docx.js"); 
  }
}
