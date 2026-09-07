// Fast, sharp and mobile-friendly PDF viewer.
// The PDF file itself is NOT compressed or modified.

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

async function loadPdf(pdfFile) {
    try {
        const pdfjsLib = await import(
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.149/pdf.mjs"
        );

        pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.149/pdf.worker.mjs";

        /*
         * Load the PDF without eagerly downloading/rendering
         * every page.
         */
        const loadingTask = pdfjsLib.getDocument({
            url: pdfFile,
            rangeChunkSize: 262144,
            disableAutoFetch: true,
            disableStream: false
        });

        const pdf = await loadingTask.promise;

        if (!pdf || !pdf.numPages) {
            showComingSoon();
            return;
        }

        container.innerHTML = "";

        /*
         * PDF controls
         */
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

        /*
         * Get only the first page initially.
         */
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
         * Create lightweight placeholders.
         * We do NOT render all pages at startup.
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
                 * 2x backing resolution for sharp text/images.
                 * This is capped so mobile doesn't become
                 * unnecessarily slow.
                 */
                const outputScale =
                    Math.min(
                        window.devicePixelRatio || 1,
                        2
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

                /*
                 * Important for mobile:
                 * visible canvas always fits the screen.
                 */
                canvas.style.width =
                    "100%";

                canvas.style.height =
                    "auto";

                canvas.style.display =
                    "block";

                pageBox.innerHTML = "";
                pageBox.appendChild(canvas);

                const ctx =
                    canvas.getContext("2d", {
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
         * FIRST PRIORITY:
         * Render only page 1 immediately.
         */
        await renderPage(pages[0]);

        /*
         * Page 2 shortly after page 1.
         */
        if (pages[1]) {
            setTimeout(() => {
                renderPage(pages[1]);
            }, 100);
        }

        /*
         * Remaining pages are loaded only
         * when they approach the screen.
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
                            "800px 0px",
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
         * ZOOM IN
         */
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

                /*
                 * Re-render currently visible pages.
                 */
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
        );

        /*
         * ZOOM OUT
         */
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
        );

        /*
         * FIT TO SCREEN
         */
        resetZoom.addEventListener(
            "click",
            async () => {

                zoom = 1;

                zoomLabel.textContent =
                    "100%";

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
 * Get PDF filename from URL.
 */
const params =
    new URLSearchParams(
        window.location.search
    );

const pdfFile =
    params.get("pdf");


/*
 * Cloudflare R2 PDF storage.
 *
 * Creative Notes PDFs:
 * 7th_chapter3_E.pdf
 *
 * Creative Solution PDFs:
 * 7th_solution_chapter3_E.pdf
 *
 * Both are loaded from the same R2 bucket.
 */
const R2_BASE_URL =
    "https://pub-a381c2de36564bf9938df8e892649d12.r2.dev/";


const pdfUrl =
    pdfFile
        ? R2_BASE_URL + encodeURIComponent(pdfFile)
        : null;


if (!pdfFile) {

    showComingSoon();

} else {

    loadPdf(pdfUrl);
}


/*
 * Existing basic protection.
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
