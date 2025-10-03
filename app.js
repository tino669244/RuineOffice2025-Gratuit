let currentContent = ""; 

document.getElementById('fileInput').addEventListener('change', handleFile);

async function handleFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const ext = file.name.split('.').pop().toLowerCase();
  const reader = new FileReader();

  if (ext === "pdf") {
    const pdfData = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
    let textContent = "";
    document.getElementById("viewer").innerHTML = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.2 });

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: context, viewport: viewport }).promise;
      document.getElementById("viewer").appendChild(canvas);

      const text = await page.getTextContent();
      text.items.forEach(item => {
        textContent += item.str + " ";
      });
      textContent += "\n\n";
    }

    currentContent = textContent;
    document.getElementById("viewerContainer").style.display = "block";

  } else if (ext === "docx") {
    reader.onload = function(e) {
      const arrayBuffer = e.target.result;
      const container = document.getElementById("viewer");
      container.innerHTML = "";
      window.docx.renderAsync(arrayBuffer, container, null, { ignoreFonts: true })
        .then(() => {
          currentContent = container.innerText; 
          document.getElementById("viewerContainer").style.display = "block";
        });
    };
    reader.readAsArrayBuffer(file);

  } else {
    alert("Format non supporté (PDF, DOCX).");
  }
}

function convertAndDownload() {
  const type = document.getElementById("conversionType").value;

  if (type === "pdf") {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const lines = currentContent.split("\n");
    let y = 10;
    lines.forEach(line => {
      doc.text(line, 10, y);
      y += 10;
      if (y > 280) {
        doc.addPage();
        y = 10;
      }
    });
    doc.save("output.pdf");

  } else if (type === "word") {
    const blob = new Blob([currentContent], { type: "application/msword" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "output.doc";
    link.click();
  }
}
