(function () {
    const $ = s => document.querySelector(s);
    const $$ = s => [...document.querySelectorAll(s)];
    const pad = n => n < 10 ? "0" + n : "" + n;
    function fmt(d, local) {
        if (!(d instanceof Date) || isNaN(d)) return "—";
        return local
            ? (d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()))
            : (d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate()));
    }


    function dateFromEpochAttr(el) {
        const v = el?.getAttribute("data-epoch");
        const n = Number(v);
        if (!Number.isFinite(n)) return new Date(NaN);
        return new Date(n * 1000);                        // seconds → ms
    }

    function buildTOC() {
        const toc = $("#toc ul"); if (!toc) return;
        toc.innerHTML = "";
        $$("#article h2, #article h3").forEach(h => {
            if (!h.id) { h.id = h.textContent.toLowerCase().replace(/[^a-z0-9]+/g, "-"); }
            const li = document.createElement("li");
            const a = document.createElement("a");
            a.href = "#" + h.id;
            a.textContent = h.textContent;
            if (h.tagName === "H3") a.className = "h3";
            li.appendChild(a);
            toc.appendChild(li);
        });
    }

    function wireCopy() {
        $$(".copyBtn").forEach(btn => {
            btn.addEventListener("click", () => {
                const code = btn.nextElementSibling?.textContent || "";
                navigator.clipboard.writeText(code).then(() => {
                    const old = btn.textContent; btn.textContent = "copied"; setTimeout(() => btn.textContent = old, 900);
                });
            });
        });
    }


    function applyTheme(name) {
        document.documentElement.dataset.theme = name;
        try { localStorage.setItem("irccTheme", name); } catch (e) { /* noop */ }
        const sel = document.getElementById("themePicker");
        if (sel) sel.value = name;
    }

    function setupThemePicker() {
        const sel = document.getElementById("themePicker");
        if (!sel) return;
        sel.addEventListener("change", e => applyTheme(e.target.value));
        let t = "gruvbox-dark";
        try { t = localStorage.getItem("irccTheme") || t; } catch (e) { }
        applyTheme(t);
    }

    document.addEventListener("DOMContentLoaded", () => {
        const yy = document.getElementById("yy"); if (yy) yy.textContent = new Date().getFullYear();
        buildTOC(); wireCopy(); setupThemePicker();
    });
})();
