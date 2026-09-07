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
      const pdfjsLib = await import("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.149/pdf.mjs");
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.149/pdf.worker.mjs";

        const pdf = await pdfjsLib.getDocument({ url: pdfFile }).promise;

        if (!pdf || !pdf.numPages) {
            showComingSoon();
            return;
        }

        container.innerHTML = "";

      const firstPage = await pdf.getPage(1);

const baseViewport = firstPage.getViewport({ scale: 1 });
const width = Math.min(
    Math.max(container.clientWidth - 20, 600),
    1000
);
const scale = width / baseViewport.width;
const viewport = firstPage.getViewport({ scale });

const pages = [];

for (let num = 1; num <= pdf.numPages; num++) {
    const pageBox = document.createElement("div");

    pageBox.className = "pdf-page-container";
    pageBox.dataset.pageNumber = num;

    pageBox.style.width = `${viewport.width}px`;
    pageBox.style.height = `${viewport.height}px`;
    pageBox.style.margin = "0 auto 20px";
    pageBox.style.position = "relative";

    container.appendChild(pageBox);

    pages.push(pageBox);
}

async function renderPage(pageBox) {
    if (pageBox.dataset.rendered === "true") return;

    pageBox.dataset.rendered = "true";

    try {
        const num = Number(pageBox.dataset.pageNumber);
        const page = num === 1
            ? firstPage
            : await pdf.getPage(num);

        const canvas = document.createElement("canvas");
        canvas.className = "pdf-page-canvas";

        const outputScale = 2;

        canvas.width = Math.floor(
            viewport.width * outputScale
        );

        canvas.height = Math.floor(
            viewport.height * outputScale
        );

        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        canvas.style.display = "block";

        pageBox.appendChild(canvas);

        const ctx = canvas.getContext("2d", {
            alpha: false
        });

        await page.render({
            canvasContext: ctx,
            viewport: viewport,
            transform: [
                outputScale,
                0,
                0,
                outputScale,
                0,
                0
            ]
        }).promise;

    } catch (error) {
        console.error(
            `PDF page ${pageBox.dataset.pageNumber} render error:`,
            error
        );
        pageBox.dataset.rendered = "false";
    }
}

if (pages[0]) {
    await renderPage(pages[0]);
}

if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    renderPage(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        },
        {
            rootMargin: "800px 0px"
        }
    );

    pages.forEach((pageBox) => {
        if (pageBox.dataset.pageNumber !== "1") {
            observer.observe(pageBox);
        }
    });
} else {
    for (const pageBox of pages) {
        await renderPage(pageBox);
    }
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
