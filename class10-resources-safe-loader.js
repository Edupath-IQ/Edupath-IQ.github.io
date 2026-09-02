/* EduPath IQ — Safe Class 10 Resources Loader v2
   Places the resources section inside the existing .main content,
   immediately before .boxes, without changing navigation or footer.
*/
(function () {
    function loadClass10Resources() {
        var mount = document.getElementById("ep10-resources-mount");
        if (!mount) return;

        var main = document.querySelector(".main");
        var boxes = document.querySelector(".boxes");

        /* Move the empty mount into the main content area before existing boxes. */
        if (main && boxes && boxes.parentElement === main) {
            main.insertBefore(mount, boxes);
        } else if (main) {
            main.appendChild(mount);
        }

        var css = document.createElement("link");
        css.rel = "stylesheet";
        css.href = "class10-resources-safe.css";
        document.head.appendChild(css);

        fetch("class10-resources-safe.html")
            .then(function (response) {
                if (!response.ok) throw new Error("Resources file could not be loaded.");
                return response.text();
            })
            .then(function (html) {
                mount.innerHTML = html;
            })
            .catch(function () {
                mount.innerHTML =
                    '<p style="text-align:center;padding:20px;">Class 10 resources are temporarily unavailable.</p>';
            });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", loadClass10Resources);
    } else {
        loadClass10Resources();
    }
})();
