let editorInstance;

// Init CKEditor
ClassicEditor
  .create(document.querySelector('#editor'))
  .then(editor => {
    editorInstance = editor;
  })
  .catch(error => {
    console.error(error);
  });

// Handle Upload
document.getElementById('fileInput').addEventListener('change', handleFile);

async function handleFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  const ext = file.name.split('.').pop().toLowerCase();

  if (ext === "pdf") {
    const pdfData = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
    let textContent = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const text = await page.getTextContent();
      text.items.forEach(item => {
        textContent += item.str + " ";
      });
      textContent += "\n\n";
    }
    document.getElementById('editorContainer').style.display = "block";
    editorInstance.setData(textContent);
  } else if (ext === "docx") {
    reader.onload = async (e) => {
      const buffer = e.target.result;
      const { parseDocument } = window.docx;
      const doc = await parseDocument(buffer);
      editorInstance.setData(doc.text || "");
      document.getElementById('editorContainer').style.display = "block";
    };
    reader.readAsArrayBuffer(file);
  } else if (ext === "txt") {
    reader.onload = (e) => {
      editorInstance.setData(e.target.result);
      document.getElementById('editorContainer').style.display = "block";
    };
    reader.readAsText(file);
  } else {
    alert("Format non supporté (PDF, DOCX, TXT).");
  }
}

// Convert & Download
function convertAndDownload() {
  const type = document.getElementById("conversionType").value;
  const content = editorInstance.getData();

  if (type === "pdf") {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.html(content, {
      callback: function (doc) {
        doc.save("output.pdf");
      },
      x: 10,
      y: 10
    });
  } else if (type === "word") {
    const blob = new Blob([content], {
      type: "application/msword"
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "output.doc";
    link.click();
  }
}
