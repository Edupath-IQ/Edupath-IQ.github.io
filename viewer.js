// Fast, sharp and mobile-friendly PDF viewer.
// The PDF itself is NOT compressed or modified.

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
        // Use the existing PDF.js files in the repository.
const pdfjsLib = await import(
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.149/pdf.mjs"
);

pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.149/pdf.worker.mjs";

        /*
         * Do not eagerly download/render every page.
         * Ask PDF.js to use range requests where the server supports them.
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

        // Only page 1 is loaded immediately.
        const firstPage = await pdf.getPage(1);

        const baseViewport = firstPage.getViewport({
            scale: 1
        });

        const pageRatio =
            baseViewport.height / baseViewport.width;

        function getPageWidth() {
            const availableWidth =
                container.clientWidth || window.innerWidth;

            /*
             * IMPORTANT:
             * Do NOT force a 600px minimum.
             * This makes the complete page fit on mobile.
             */
            return Math.min(
                Math.max(availableWidth - 12, 280),
                1000
            );
        }

        const pages = [];

        // Create lightweight page placeholders.
        for (let num = 1; num <= pdf.numPages; num++) {

            const width = getPageWidth();
            const height = width * pageRatio;

            const pageBox =
                document.createElement("div");

            pageBox.className =
                "pdf-page-container";

            pageBox.dataset.pageNumber =
                String(num);

            pageBox.dataset.rendered =
                "false";

            pageBox.style.width = "100%";
            pageBox.style.maxWidth =
                `${width}px`;

            pageBox.style.height =
                `${height}px`;

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
                pageBox.dataset.rendered === "true" ||
                pageBox.dataset.rendering === "true"
            ) {
                return;
            }

            pageBox.dataset.rendering =
                "true";

            try {

                const pageNumber =
                    Number(
                        pageBox.dataset.pageNumber
                    );

                const page =
                    pageNumber === 1
                        ? firstPage
                        : await pdf.getPage(pageNumber);

                const width =
                    getPageWidth();

                const scale =
                    width /
                    baseViewport.width;

                const viewport =
                    page.getViewport({
                        scale: scale
                    });

                /*
                 * Good clarity without creating
                 * extremely large canvases.
                 */
                const outputScale =
                    window.devicePixelRatio > 1
                        ? 2
                        : 1.5;

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
                 * CSS width makes the complete page
                 * fit the phone screen.
                 */
                canvas.style.width =
                    "100%";

                canvas.style.height =
                    "auto";

                canvas.style.display =
                    "block";

                pageBox.style.maxWidth =
                    `${width}px`;

                pageBox.style.height =
                    `${viewport.height}px`;

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

                pageBox.dataset.rendered =
                    "false";

            } finally {

                pageBox.dataset.rendering =
                    "false";
            }
        }

        /*
         * MOST IMPORTANT:
         * Show page 1 first.
         */
        await renderPage(pages[0]);

        /*
         * Then prepare page 2.
         * Remaining pages wait until needed.
         */
        if (pages[1]) {
            setTimeout(() => {
                renderPage(pages[1]);
            }, 50);
        }

        /*
         * Lazy-load remaining pages while scrolling.
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
                            "700px 0px",
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

        } else {

            /*
             * Older-browser fallback.
             */
            for (
                let i = 2;
                i < pages.length;
                i++
            ) {
                renderPage(pages[i]);
            }
        }

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


// Get PDF filename from URL.
const params =
    new URLSearchParams(
        window.location.search
    );

const pdfFile =
    params.get("pdf");

if (!pdfFile) {

    showComingSoon();

} else {

    loadPdf(pdfFile);
}


// Keep the existing basic protection.
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
