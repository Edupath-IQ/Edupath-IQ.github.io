// Fast, sharp and mobile-friendly PDF viewer.
// Original PDF files are NOT compressed or modified.

const container = document.getElementById("pdfContainer");

function showComingSoon(message = "This resource has not been uploaded yet.") {
    if (!container) return;

    container.innerHTML = `
        <div class="coming-soon-card">
            <div class="coming-soon-icon">📚</div>
            <h2>Coming Soon</h2>
            <p>${message}</p>
        </div>
    `;
}

function showFirstPagePreview(pdfFile) {
    if (!container) return;

    const isChapter5Preview =
        /(?:^|\\/)10th_chapter5_Life_Processes_E\\.pdf$/i.test(pdfFile);

    if (!isChapter5Preview) return;

    container.innerHTML = "";

    const previewWrap = document.createElement("div");
    previewWrap.className = "pdf-first-page-preview";
    previewWrap.style.width = "100%";
    previewWrap.style.maxWidth = "1000px";
    previewWrap.style.margin = "0 auto 16px";
    previewWrap.style.position = "relative";
    previewWrap.style.background = "#fff";
    previewWrap.style.minHeight = "420px";
    previewWrap.style.display = "flex";
    previewWrap.style.justifyContent = "center";
    previewWrap.style.alignItems = "flex-start";
    previewWrap.style.overflow = "hidden";

    const previewImage = document.createElement("img");
    previewImage.src = "10th_chapter5_Life_Processes_preview.webp";
    previewImage.alt = "Class 10 Science Chapter 5 - Life Processes";
    previewImage.decoding = "async";
    previewImage.fetchPriority = "high";
    previewImage.style.width = "100%";
    previewImage.style.height = "auto";
    previewImage.style.display = "block";
    previewImage.style.userSelect = "none";
    previewImage.draggable = false;

    previewWrap.appendChild(previewImage);
    container.appendChild(previewWrap);
}

async function loadPdf(pdfFile) {
    try {
        // Show the lightweight first-page preview immediately.
        // PDF.js loading starts right after it, without waiting for the preview.
        showFirstPagePreview(pdfFile);
        const pdfjsLib = await import(
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.149/pdf.mjs"
        );

        pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.149/pdf.worker.mjs";

        /*
         * R2 first-page optimized loading.
         * Small range chunks reduce initial latency and auto-fetch is disabled
         * so the viewer does not pull the rest of the PDF before page 1.
         */
        const loadingTask = pdfjsLib.getDocument({
            url: pdfFile,
            rangeChunkSize: 524288,
            disableAutoFetch: true,
            disableStream: false,
            stopAtErrors: false
        });

        const pdf = await loadingTask.promise;

        if (!pdf || !pdf.numPages) {
            showComingSoon();
            return;
        }

        container.innerHTML = "";

        /* PDF controls */
        const controls = document.createElement("div");

        controls.style.position = "sticky";
        controls.style.top = "0";
        controls.style.zIndex = "20";
        controls.style.display = "flex";
        controls.style.justifyContent = "center";
        controls.style.alignItems = "center";
        controls.style.gap = "8px";
        controls.style.padding = "8px";
        controls.style.background = "rgba(255,255,255,0.96)";
        controls.style.borderBottom = "1px solid #ddd";

        const zoomOut = document.createElement("button");
        zoomOut.textContent = "−";

        const zoomLabel = document.createElement("span");
        zoomLabel.textContent = "100%";

        const zoomIn = document.createElement("button");
        zoomIn.textContent = "+";

        const resetZoom = document.createElement("button");
        resetZoom.textContent = "Fit";

        [zoomOut, zoomIn, resetZoom].forEach((button) => {
            button.style.minWidth = "42px";
            button.style.minHeight = "38px";
            button.style.fontSize = "20px";
            button.style.cursor = "pointer";
            button.style.border = "1px solid #bbb";
            button.style.borderRadius = "6px";
            button.style.background = "#fff";
        });

        zoomLabel.style.minWidth = "55px";
        zoomLabel.style.textAlign = "center";
        zoomLabel.style.fontWeight = "600";

        controls.appendChild(zoomOut);
        controls.appendChild(zoomLabel);
        controls.appendChild(zoomIn);
        controls.appendChild(resetZoom);

        container.appendChild(controls);

        /* First page */
        const firstPage = await pdf.getPage(1);

        const baseViewport = firstPage.getViewport({
            scale: 1
        });

        let zoom = 1;

        function getAvailableWidth() {
            const width =
                container.clientWidth ||
                window.innerWidth;

            return Math.max(
                Math.min(width - 12, 1000),
                280
            );
        }

        function getScale() {
            return (
                getAvailableWidth() /
                baseViewport.width
            ) * zoom;
        }

        const pages = [];

        /*
         * Lightweight placeholders.
         * Actual pages are rendered progressively.
         */
        for (
            let number = 1;
            number <= pdf.numPages;
            number++
        ) {
            const pageBox =
                document.createElement("div");

            pageBox.className =
                "pdf-page-container";

            pageBox.dataset.pageNumber =
                String(number);

            pageBox.dataset.rendered =
                "false";

            pageBox.style.width = "100%";
            pageBox.style.maxWidth = "1000px";
            pageBox.style.margin =
                "0 auto 16px";

            pageBox.style.position =
                "relative";

            pageBox.style.overflow =
                "hidden";

            container.appendChild(pageBox);

            pages.push(pageBox);
        }

        async function renderPage(pageBox) {

            if (
                pageBox.dataset.rendering === "true"
            ) {
                return;
            }

            pageBox.dataset.rendering =
                "true";

            try {
                const number =
                    Number(
                        pageBox.dataset.pageNumber
                    );

                const page =
                    number === 1
                        ? firstPage
                        : await pdf.getPage(number);

                const scale =
                    getScale();

                const viewport =
                    page.getViewport({
                        scale: scale
                    });

                /*
                 * Different quality levels:
                 *
                 * Page 1:
                 * lower resolution for faster opening.
                 *
                 * Page 2 onward:
                 * higher resolution for better mobile clarity.
                 */
               const devicePixelRatio =
    window.devicePixelRatio || 1;

const isMobile =
    window.matchMedia &&
    window.matchMedia(
        "(max-width: 768px)"
    ).matches;

let maxOutputScale;

if (isMobile) {
    maxOutputScale =
        number === 1
            ? 2
            : 3.5;
} else {
    maxOutputScale =
        2;
}

const outputScale =
    Math.min(
        devicePixelRatio,
        maxOutputScale
    );
                const canvas =
                    document.createElement("canvas");

                canvas.className =
                    "pdf-page-canvas";

                canvas.width =
                    Math.ceil(
                        viewport.width *
                        outputScale
                    );

                canvas.height =
                    Math.ceil(
                        viewport.height *
                        outputScale
                    );

                canvas.style.width =
                    "100%";

                canvas.style.height =
                    "auto";

                canvas.style.display =
                    "block";

                canvas.style.imageRendering =
                    "auto";

                pageBox.innerHTML = "";
                pageBox.appendChild(canvas);

                const ctx =
                    canvas.getContext("2d", {
                        alpha: false,
                        desynchronized: true
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
                    ],

                    intent: "display"

                }).promise;

                /*
                 * Preserve clickable PDF annotations/links.
                 * The canvas itself does not render PDF link annotations,
                 * so create transparent link overlays from the original PDF.
                 */
                if (typeof page.getAnnotations === "function") {
                    const annotations = await page.getAnnotations({
                        intent: "display"
                    });

                    const linkLayer = document.createElement("div");
                    linkLayer.className = "pdf-link-layer";
                    linkLayer.style.position = "absolute";
                    linkLayer.style.left = "0";
                    linkLayer.style.top = "0";
                    linkLayer.style.width = "100%";
                    linkLayer.style.height = "100%";
                    linkLayer.style.pointerEvents = "none";
                    linkLayer.style.zIndex = "5";

                    for (const annotation of annotations) {
                        if (annotation.subtype !== "Link") continue;

                        const url =
                            annotation.url ||
                            annotation.unsafeUrl;

                        if (!url || !annotation.rect) continue;

                        const rect = viewport.convertToViewportRectangle(
                            annotation.rect
                        );

                        const left = Math.min(rect[0], rect[2]);
                        const top = Math.min(rect[1], rect[3]);
                        const width = Math.abs(rect[2] - rect[0]);
                        const height = Math.abs(rect[3] - rect[1]);

                        const link = document.createElement("a");
                        link.href = url;
                        link.target = "_blank";
                        link.rel = "noopener noreferrer";
                        link.setAttribute("aria-label", "Open PDF link");
                        link.style.position = "absolute";
                        link.style.left = `${left}px`;
                        link.style.top = `${top}px`;
                        link.style.width = `${width}px`;
                        link.style.height = `${height}px`;
                        link.style.display = "block";
                        link.style.pointerEvents = "auto";
                        link.style.background = "transparent";
                        link.style.cursor = "pointer";

                        linkLayer.appendChild(link);
                    }

                    if (linkLayer.children.length) {
                        pageBox.appendChild(linkLayer);
                    }
                }

                pageBox.dataset.rendered =
                    "true";

            } catch (error) {

                console.error(
                    "PDF page render error:",
                    error
                );

            } finally {

                pageBox.dataset.rendering =
                    "false";
            }
        }

        /*
         * First page gets highest priority.
         */
        await renderPage(pages[0]);

        /*
         * Page 2 loads shortly after page 1.
         */
        if (pages[1]) {
            setTimeout(() => {
                renderPage(pages[1]);
            }, 800);
        }

        /*
         * Remaining pages load progressively
         * as they approach the viewport.
         */
        if (
            "IntersectionObserver" in window
        ) {

            const observer =
                new IntersectionObserver(
                    (entries) => {

                        entries.forEach(
                            (entry) => {

                                if (
                                    entry.isIntersecting
                                ) {

                                    renderPage(
                                        entry.target
                                    );

                                    observer.unobserve(
                                        entry.target
                                    );
                                }
                            }
                        );
                    },
                    {
                        rootMargin:
                            "200px 0px",

                        threshold: 0
                    }
                );

            pages.forEach(
                (pageBox) => {

                    const number =
                        pageBox.dataset
                            .pageNumber;

                    if (
                        number !== "1" &&
                        number !== "2"
                    ) {

                        observer.observe(
                            pageBox
                        );
                    }
                }
            );
        }

        /*
         * Re-render pages already rendered
         * after zoom/size changes.
         */
        async function rerenderRenderedPages() {

            for (
                const pageBox of pages
            ) {

                if (
                    pageBox.dataset
                        .rendered === "true"
                ) {

                    pageBox.dataset
                        .rendered = "false";

                    await renderPage(
                        pageBox
                    );
                }
            }
        }

        /* Zoom In */
        zoomIn.addEventListener(
            "click",
            async () => {

                if (zoom >= 2) return;

                zoom =
                    Math.min(
                        zoom + 0.25,
                        2
                    );

                zoomLabel.textContent =
                    `${Math.round(zoom * 100)}%`;

                await rerenderRenderedPages();
            }
        );

        /* Zoom Out */
        zoomOut.addEventListener(
            "click",
            async () => {

                if (zoom <= 0.75) return;

                zoom =
                    Math.max(
                        zoom - 0.25,
                        0.75
                    );

                zoomLabel.textContent =
                    `${Math.round(zoom * 100)}%`;

                await rerenderRenderedPages();
            }
        );

        /* Fit */
        resetZoom.addEventListener(
            "click",
            async () => {

                zoom = 1;

                zoomLabel.textContent =
                    "100%";

                await rerenderRenderedPages();
            }
        );

        /*
         * Re-render after device orientation
         * or browser width changes.
         */
        let resizeTimer;

        window.addEventListener(
            "resize",
            () => {

                clearTimeout(
                    resizeTimer
                );

                resizeTimer =
                    setTimeout(
                        async () => {

                            await rerenderRenderedPages();

                        },
                        250
                    );
            }
        );

    } catch (error) {

        console.error(
            "PDF load error:",
            error
        );

        showComingSoon(
            "Unable to load this PDF right now."
        );
    }
}


/*
 * Read PDF filename from URL.
 */
const params =
    new URLSearchParams(
        window.location.search
    );

const pdfFile =
    params.get("pdf");


/*
 * Cloudflare R2 storage.
 *
 * Creative Notes:
 * 7th_chapter3_E.pdf
 *
 * Creative Solutions:
 * 7th_solution_chapter3_E.pdf
 *
 * Both use the same R2 bucket.
 */
const R2_BASE_URL =
    "https://pub-a381c2de36564bf9938df8e892649d12.r2.dev";


function getPdfSource(filename) {

    if (!filename) {
        return null;
    }

    /*
     * Creative Notes / Creative Solutions
     * PDF filename pattern.
     */
    const isCreativePdf =
        /^\d+(st|nd|rd|th)_(?:solution_)?chapter\d+(?:_[A-Za-z0-9_-]+)?_[EH]\.pdf$/i.test(
            filename
        );

    return isCreativePdf
        ? `${R2_BASE_URL}/${encodeURIComponent(filename)}`
        : filename;
}


if (!pdfFile) {

    showComingSoon();

} else {

    loadPdf(
        getPdfSource(pdfFile)
    );
}


/*
 * Basic protection.
 */
document.addEventListener(
    "contextmenu",
    function (e) {
        e.preventDefault();
    }
);

document.addEventListener(
    "keydown",
    function (e) {

        if (
            e.ctrlKey &&
            ["s", "p", "u"].includes(
                e.key.toLowerCase()
            )
        ) {
            e.preventDefault();
        }
    }
);
