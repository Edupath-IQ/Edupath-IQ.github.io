import * as pdfjsLib from "./pdfjs/pdf.min.mjs";
pdfjsLib.GlobalWorkerOptions.workerSrc="./pdfjs/pdf.min.mjs";
let pdfDoc=null;
const container=document.getElementById("pdfContainer");

async function renderPage(num)
  {
    try
    {
   const page=await pdfDoc.getPage(num);
    const canvas=document.createElement("canvas");
    canvas.className="pdf-page-canvas";
    const ctx=canvas.getContext("2d");
    const unscaledViewport=page.getViewport({scale:1});
    const containerWidth= container.clientWidth;
    const scale=(containerWidth-60)/unscaledViewport.width;
    const viewport=page.getViewport({scale:scale});
    canvas.width=viewport.width;
    canvas.height=viewport.height;
    container.appendChild(canvas);
    await page.render({canvasContext:ctx, viewport:viewport}).promise;
    }catch(err)
    {
        console.error("Page render me dikkat aa rhi h", num, err);
    }    
}
const params=new URLSearchParams(window.location.search);
const pdfFile=params.get("pdf");
pdfjsLib.getDocument({url:pdfFile}).promise.then(async pdf=>{
pdfDoc=pdf;
for(let i=1;i<=pdfDoc.numPages;i++)
{
await renderPage(i);
}
}).catch(error=>{
    console.error("PDF load karne me dikkat aa rhi h:", error);
});


document.addEventListener("contextmenu",function(e)
    {
     e.preventDefault();
    });

document.addEventListener("keydown",function(e){
if(
    
    e.ctrlKey && (e.key=="s"||e.key=="p"||e.key=="u"))
{
e.preventDefault();
}
});
