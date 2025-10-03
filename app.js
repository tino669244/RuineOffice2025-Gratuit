let editorInstance;

// Init CKEditor
ClassicEditor.create(document.querySelector('#editor'))
  .then(editor => { editorInstance = editor; })
  .catch(err => console.error(err));

// Handle Upload PDF
document.getElementById('fileInput').addEventListener('change', async (e)=>{
  const file = e.target.files[0];
  if(!file) return;

  const ext = file.name.split('.').pop().toLowerCase();
  const reader = new FileReader();

  if(ext === "pdf") {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let textContent = "";

    for(let i=1;i<=pdf.numPages;i++){
      const page = await pdf.getPage(i);
      const text = await page.getTextContent();
      text.items.forEach(item => { textContent += item.str + " "; });
      textContent += "\n\n";
    }

    editorInstance.setData(textContent);
    document.getElementById('editorContainer').style.display="block";

  } else {
    alert("Seul PDF est supporté pour édition actuellement.");
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
