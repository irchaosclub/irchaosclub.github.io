(function () {
    // ---------- utils ----------
    const $ = (s, el = document) => el.querySelector(s);
    const $$ = (s, el = document) => [...el.querySelectorAll(s)];
    const slug = s => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

    // ---------- TOC ----------
    function buildTOC() {
        const list = $("#toc ul");
        if (!list) return;

        const frag = document.createDocumentFragment();
        $$("#article h2, #article h3").forEach(h => {
            if (!h.id) h.id = slug(h.textContent);
            const li = document.createElement("li");
            const a = document.createElement("a");
            a.href = `#${h.id}`;
            a.textContent = h.textContent;
            if (h.tagName === "H3") a.className = "h3";
            li.appendChild(a);
            frag.appendChild(li);
        });

        list.replaceChildren(frag);
    }

    // ---------- copy buttons (delegated) ----------
    function wireCopy() {
        document.addEventListener("click", async e => {
            const btn = e.target.closest(".copyBtn");
            if (!btn) return;
            const code = btn.nextElementSibling?.textContent || "";
            try {
                await navigator.clipboard.writeText(code);
                const old = btn.textContent;
                btn.textContent = "copied";
                setTimeout(() => (btn.textContent = old), 900);
            } catch { }
        });
    }

    // ---------- theme ----------
    const THEME_KEY = "irccTheme";
    function applyTheme(name) {
        document.documentElement.dataset.theme = name;
        try { localStorage.setItem(THEME_KEY, name); } catch { }
        const sel = $("#themePicker"); if (sel) sel.value = name;
    }
    function setupThemePicker() {
        const sel = $("#themePicker");
        if (!sel) return;
        sel.addEventListener("change", e => applyTheme(e.target.value));
        const saved = (() => { try { return localStorage.getItem(THEME_KEY); } catch { return null; } })();
        applyTheme(saved || "gruvbox-dark");
    }

    // ---------- init ----------
    document.addEventListener("DOMContentLoaded", () => {
        const yy = $("#yy"); if (yy) yy.textContent = new Date().getFullYear();
        buildTOC();
        wireCopy();
        setupThemePicker();
    });
})();
