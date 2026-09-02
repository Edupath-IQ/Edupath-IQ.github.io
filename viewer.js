// Safe PDF viewer: show Coming Soon when no PDF is supplied,
// and load PDF.js only when a PDF is actually requested.

const container = document.getElementById("pdfContainer");

function showComingSoon(message = "This resource has not been uploaded yet.") {
    if (!container) return;
    container.innerHTML = `
        <div class="coming-soon-card">
            <div class="coming-soon-icon">📚</div>
            <h2>Coming Soon</h2>
            <p>${message}</p>
        </div>`;
}

async function loadPdf(pdfFile) {
    try {
        // Load PDF.js only after we know a PDF was requested.
        const pdfjsLib = await import("./pdfjs/pdf.mjs");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "./pdfjs/pdf.worker.mjs";

        const pdf = await pdfjsLib.getDocument({ url: pdfFile }).promise;

        if (!pdf || !pdf.numPages) {
            showComingSoon();
            return;
        }

        container.innerHTML = "";

        for (let num = 1; num <= pdf.numPages; num++) {
            const page = await pdf.getPage(num);
            const canvas = document.createElement("canvas");
            canvas.className = "pdf-page-canvas";
            const ctx = canvas.getContext("2d");

            const baseViewport = page.getViewport({ scale: 1 });
            const width = Math.max(container.clientWidth - 60, 300);
            const scale = width / baseViewport.width;
            const viewport = page.getViewport({ scale });

            canvas.width = viewport.width;
            canvas.height = viewport.height;
            container.appendChild(canvas);

            await page.render({
                canvasContext: ctx,
                viewport: viewport
            }).promise;
        }
    } catch (error) {
        console.error("PDF load error:", error);
        showComingSoon();
    }
}

const params = new URLSearchParams(window.location.search);
const pdfFile = params.get("pdf");

// No PDF supplied = no JavaScript/PDF.js dependency is needed.
if (!pdfFile) {
    showComingSoon();
} else {
    loadPdf(pdfFile);
}

document.addEventListener("contextmenu", function (e) {
    e.preventDefault();
});

document.addEventListener("keydown", function (e) {
    if (e.ctrlKey && ["s", "p", "u"].includes(e.key.toLowerCase())) {
        e.preventDefault();
    }
});
