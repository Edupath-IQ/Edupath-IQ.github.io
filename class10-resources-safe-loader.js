/* EduPath IQ — Safe Class 10 Resources Loader
   Loads the isolated Class 10 resources section without modifying
   the existing navigation, homepage, or footer structure.
*/
(function () {
    function loadClass10Resources() {
        var mount = document.getElementById("ep10-resources-mount");
        if (!mount) return;

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
