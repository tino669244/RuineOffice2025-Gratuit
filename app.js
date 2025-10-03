let editorInstance;

// Init CKEditor
ClassicEditor.create(document.querySelector('#editor'))
  .then(editor => { editorInstance = editor; })
  .catch(err => console.error(err));

document.getElementById('fileInput').addEventListener('change', async (e)=>{
  const file = e.target.files[0];
  if(!file) return;

  const ext = file.name.split('.').pop().toLowerCase();
  const reader = new FileReader();

  if(ext === "pdf") {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";

    for(let i=1;i<=pdf.numPages;i++){
      const page = await pdf.getPage(i);

      // Text content classique
      const text = await page.getTextContent();
      let pageText = "";
      text.items.forEach(item => { pageText += item.str + " "; });
      pageText += "\n\n";

      // Si PDF text layer vide, lance OCR
      if(pageText.trim() === ""){
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({canvasContext: canvas.getContext("2d"), viewport}).promise;

        const { data: { text: ocrText } } = await Tesseract.recognize(canvas, 'fra', { logger: m => console.log(m) });
        pageText = ocrText + "\n\n";
      }

      fullText += pageText;
    }

    editorInstance.setData(fullText);
    document.getElementById('editorContainer').style.display="block";

  } else if(ext === "png" || ext === "jpg" || ext === "jpeg") {
    reader.onload = async (event)=>{
      const img = new Image();
      img.src = event.target.result;
      img.onload = async ()=>{
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img,0,0);
        const { data: { text } } = await Tesseract.recognize(canvas,'fra',{ logger:m=>console.log(m)});
        editorInstance.setData(text);
        document.getElementById('editorContainer').style.display="block";
      }
    };
    reader.readAsDataURL(file);

  } else {
    alert("Format non supporté. PDF / PNG / JPG seulement.");
  }
});

// Convert & Download
function convertAndDownload(){
  const type = document.getElementById("conversionType").value;
  const content = editorInstance.getData();

  if(type==="pdf"){
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const lines = content.split("\n");
    let y = 10;
    lines.forEach(line=>{
      doc.text(line,10,y);
      y+=10;
      if(y>280){ doc.addPage(); y=10; }
    });
    doc.save("output.pdf");

  } else if(type==="word"){
    const blob = new Blob([content], {type:"application/msword"});
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "output.doc";
    link.click();
  }
}
