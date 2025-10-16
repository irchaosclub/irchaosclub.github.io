(function () {
    const $ = s => document.querySelector(s);
    const toDate = s => new Date(s);
    const pad = n => (n < 10 ? "0" + n : "" + n);

    function fmtDate(d, local) {
        if (!(d instanceof Date) || isNaN(d)) return "—";
        const y = local ? d.getFullYear() : d.getUTCFullYear();
        const m = local ? d.getMonth() + 1 : d.getUTCMonth() + 1;
        const day = local ? d.getDate() : d.getUTCDate();
        return y + "-" + pad(m) + "-" + pad(day);
    }

    function withinRange(d, range) {
        if (range === "all") return true;
        const days = parseInt(range, 10);
        const cutoff = new Date(Date.now() - days * 24 * 3600 * 1000);
        return d >= cutoff;
    }

    function parseQuery(text) {
        const tokens = text.trim().split(/\s+/).filter(Boolean);
        const out = { any: [], tag: [], author: [], title: [] };
        for (const t of tokens) {
            if (t.startsWith("tag:")) out.tag.push(t.slice(4).toLowerCase());
            else if (t.startsWith("author:")) out.author.push(t.slice(7).toLowerCase());
            else if (t.startsWith("title:")) out.title.push(t.slice(6).toLowerCase());
            else out.any.push(t.toLowerCase());
        }
        return out;
    }

    const state = {
        q: "",
        range: "30",
        tagFilters: new Set(),
        authorFilters: new Set(),
        selId: null,
        tzLocal: false,
    };

    function renderContributors() {
        const wrap = $("#contributors");
        if (!wrap) return;
        wrap.innerHTML = "";
        (window.CONTRIBUTORS || []).forEach(name => {
            const chip = document.createElement("button");
            chip.type = "button";
            chip.className = "chip";
            chip.dataset.author = name.toLowerCase();
            chip.innerHTML = `<span class="dot"></span><span>${name}</span>`;
            chip.addEventListener("click", () => {
                const key = chip.dataset.author;
                if (state.authorFilters.has(key)) {
                    state.authorFilters.delete(key);
                    chip.classList.remove("active");
                } else {
                    state.authorFilters.add(key);
                    chip.classList.add("active");
                }
                update();
            });
            wrap.appendChild(chip);
        });
    }

    function renderTagFacet(posts) {
        const counts = new Map();
        const ranged = posts.filter(p => withinRange(toDate(p.time), state.range));
        for (const p of ranged) for (const t of p.tags || []) counts.set(t, 1 + (counts.get(t) || 0));

        const items = [...counts.entries()].sort((a, b) => b[1] - a[1]);
        const wrap = $("#facet-tags");
        if (!wrap) return;
        wrap.innerHTML = "";

        items.forEach(([tag, ct]) => {
            const row = document.createElement("div");
            row.className = "row";

            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "tag";
            btn.textContent = tag;
            btn.dataset.tag = tag.toLowerCase();
            if (state.tagFilters.has(btn.dataset.tag)) btn.classList.add("active");
            btn.addEventListener("click", () => {
                const key = btn.dataset.tag;
                if (state.tagFilters.has(key)) {
                    state.tagFilters.delete(key);
                    btn.classList.remove("active");
                } else {
                    state.tagFilters.add(key);
                    btn.classList.add("active");
                }
                update();
            });

            const ctEl = document.createElement("div");
            ctEl.className = "ct";
            ctEl.textContent = String(ct);

            row.append(btn, ctEl);
            wrap.appendChild(row);
        });
    }

    function matchPost(p) {
        const t = toDate(p.time);
        if (!withinRange(t, state.range)) return false;

        // Tag filters (AND)
        for (const tag of state.tagFilters) {
            if (!(p.tags || []).map(x => x.toLowerCase()).includes(tag)) return false;
        }

        // Author filters (OR)
        if (state.authorFilters.size) {
            const lower = (p.authors || []).map(a => a.toLowerCase());
            let hit = false;
            for (const a of state.authorFilters) if (lower.includes(a)) { hit = true; break; }
            if (!hit) return false;
        }

        if (!state.q) return true;

        const q = parseQuery(state.q);
        const hayTitle = (p.title || "").toLowerCase();
        const hayAuthors = (p.authors || []).map(x => x.toLowerCase());
        const hayTags = (p.tags || []).map(x => x.toLowerCase());
        const hayExcerpt = (p.excerpt || "").toLowerCase();

        if (q.tag.length && !q.tag.every(tg => hayTags.includes(tg))) return false;
        if (q.author.length && !q.author.every(a => hayAuthors.some(x => x.includes(a)))) return false;
        if (q.title.length && !q.title.every(s => hayTitle.includes(s))) return false;
        if (q.any.length && !q.any.every(w =>
            hayTitle.includes(w) ||
            hayAuthors.some(a => a.includes(w)) ||
            hayTags.some(tg => tg.includes(w)) ||
            hayExcerpt.includes(w))) return false;

        return true;
    }

    function renderHistogram(posts) {
        const hist = $("#hist");
        if (!hist) return;
        hist.innerHTML = "";

        const now = new Date();
        const days = state.range === "all" ? 30 : parseInt(state.range, 10);
        const byDay = new Map();

        for (let i = days - 1; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 86400000);
            const key = d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate());
            byDay.set(key, 0);
        }

        posts.forEach(p => {
            const d = toDate(p.time);
            const key = d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate());
            if (byDay.has(key)) byDay.set(key, byDay.get(key) + 1);
        });

        const vals = [...byDay.values()];
        const max = Math.max(1, ...vals);
        vals.forEach(v => {
            const bar = document.createElement("div");
            bar.className = "bar";
            let h = Math.round((v / max) * 100);
            if (h === 0 && max > 0) h = 3;
            bar.style.height = h + "%";
            bar.title = v + " post" + (v === 1 ? "" : "s");
            hist.appendChild(bar);
        });

        $("#countLabel").textContent = posts.length + " post" + (posts.length === 1 ? "" : "s");
        $("#dateLabel").textContent = state.range === "all" ? "last 30d view" : "window: last " + state.range + "d";
    }

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
    }

    function renderTable(posts) {
        const tbody = $("#rows");
        if (!tbody) return;
        tbody.innerHTML = "";

        posts.sort((a, b) => new Date(b.time) - new Date(a.time));

        posts.forEach(p => {
            const tr = document.createElement("tr");
            tr.dataset.id = p.id;

            const dateStr = fmtDate(new Date(p.time), false);

            const authorsHTML = (p.authors || [])
                .map(a => `<span class="pill">${escapeHtml(a)}</span>`)
                .join(" ");

            const tagsHTML = (p.tags || [])
                .slice(0, 3)
                .map(t => `<span class="tag">${escapeHtml(t)}</span>`)
                .join("");

            const linkAttrs = p.type === "external"
                ? `href="${escapeHtml(p.link)}" target="_blank" rel="noopener"`
                : `href="${escapeHtml(p.link)}"`;

            // NOTE: no generic "title" class here — only "col-title" to avoid CSS bleed
            tr.innerHTML = [
                `<td class="col-time"><span class="ts">${dateStr}</span></td>`,
                `<td class="col-authors">${authorsHTML}</td>`,
                `<td class="col-title"><a ${linkAttrs}>${escapeHtml(p.title)}</a>${p.type === "external" ? '<span class="pill sev-warn" style="margin-left:8px">external</span>' : ''}</td>`,
                `<td class="col-tags">${tagsHTML}</td>`
            ].join("");

            // if anything tagged managed to get into the title cell, nuke it
            tr.querySelectorAll(".col-title .tag").forEach(n => n.remove());

            tr.addEventListener("click", () => {
                state.selId = p.id;
                [...tbody.children].forEach(r => r.classList.remove("sel"));
                tr.classList.add("sel");
                renderDetails(p);
            });

            tbody.appendChild(tr);
        });

        if (posts.length && !state.selId) {
            state.selId = posts[0].id;
            tbody.firstElementChild?.classList.add("sel");
            renderDetails(posts[0]);
        }
        if (!posts.length) {
            $("#details").innerHTML = `<p style="color:var(--muted)">No posts match the current filters.</p>`;
            state.selId = null;
        }

        sizeAuthorsAndTagsColumns();
    }

    function renderDetails(p) {
        const d = $("#details");
        if (!d) return;

        const excerptText = (p.excerpt || "").replace(/</g, "&lt;");
        const isLong = excerptText.length > 450;

        d.innerHTML = `
      <h3>${p.title}</h3>
      <div class="kv">
        <div class="k">author</div><div>${(p.authors || []).join(", ")}</div>
        <div class="k">tags</div><div class="tags">${(p.tags || []).map(t => `<span class="tag">${t}</span>`).join("")}</div>
        <div class="k">type</div><div>${p.type}</div>
      </div>
      <div class="excerpt ${isLong ? "clamp" : ""}" id="ex">${excerptText}</div>
      ${isLong ? `<button class="more" id="exMore" type="button" aria-expanded="false">Show more</button>` : ""}
      <div style="margin-top:10px">
        ${p.type === "external"
                ? `<a class="dl" href="${p.link}" target="_blank" rel="noopener">Open external post ↗</a>`
                : `<a class="dl" href="${p.link}">Open post</a>`}
      </div>
    `;

        if (isLong) {
            const ex = d.querySelector("#ex");
            const btn = d.querySelector("#exMore");
            btn.addEventListener("click", () => {
                ex.classList.toggle("clamp");
                const expanded = !ex.classList.contains("clamp");
                btn.textContent = expanded ? "Show less" : "Show more";
                btn.setAttribute("aria-expanded", String(expanded));
            });
        }
    }

    function update() {
        const filtered = (window.POSTS || []).map(p => {
            p.authors = p.authors || (p.author ? [p.author] : []);
            return p;
        }).filter(matchPost);

        renderHistogram(filtered);
        renderTagFacet(window.POSTS || []);
        renderTable(filtered);
    }

    // --- column sizing / resizers (unchanged behaviour, but scoped) ---
    function sizeAuthorsAndTagsColumns() {
        const colTime = document.getElementById('col-time');
        const colAuthors = document.getElementById('col-authors');
        const colTitle = document.getElementById('col-title');
        const colTags = document.getElementById('col-tags');
        const tbody = document.getElementById('rows');
        const table = document.querySelector('table.events');
        if (!colAuthors || !colTags || !tbody || !table) return;

        let maxAuthor = 0;
        tbody.querySelectorAll('td.col-authors .pill').forEach(p => {
            const w = Math.ceil(p.getBoundingClientRect().width);
            if (w > maxAuthor) maxAuthor = w;
        });

        let maxTagsContent = 0;
        tbody.querySelectorAll('td.col-tags').forEach(td => {
            const pills = [...td.querySelectorAll('.tag')].slice(0, 3);
            if (!pills.length) return;
            const probe = document.createElement('div');
            probe.style.cssText = 'position:absolute;visibility:hidden;left:-9999px;top:-9999px;white-space:nowrap;display:flex;gap:6px;';
            pills.forEach(p => probe.appendChild(p.cloneNode(true)));
            document.body.appendChild(probe);
            const w = Math.ceil(probe.getBoundingClientRect().width);
            if (w > maxTagsContent) maxTagsContent = w;
            probe.remove();
        });

        const PAD = 20;
        const authorsW = Math.max(120, maxAuthor + PAD);
        const tagsWRaw = maxTagsContent ? (maxTagsContent + PAD - 1) : 120;

        const minTitle = 240;
        const W = table.getBoundingClientRect().width;
        const timeW = (colTime?.getBoundingClientRect().width || 0);
        const tagsW = Math.max(120, Math.min(tagsWRaw, W - timeW - authorsW - minTitle));

        if (colAuthors) colAuthors.style.width = authorsW + 'px';
        if (colTags) colTags.style.width = tagsW + 'px';
        if (colTitle) colTitle.style.width = '';
    }

    let _rszTimer;
    window.addEventListener('resize', () => {
        clearTimeout(_rszTimer);
        _rszTimer = setTimeout(sizeAuthorsAndTagsColumns, 120);
    });

    function setupThemePicker() {
        const sel = $("#themePicker");
        if (!sel) return;
        sel.addEventListener("change", e => applyTheme(e.target.value));
        let t = "gruvbox-dark";
        try { t = localStorage.getItem("irccTheme") || t; } catch (e) { }
        applyTheme(t);
    }
    function applyTheme(name) {
        document.documentElement.dataset.theme = name;
        try { localStorage.setItem("irccTheme", name); } catch (e) { }
        const sel = $("#themePicker"); if (sel) sel.value = name;
    }

    function init() {
        const yy = $("#yy"); if (yy) yy.textContent = new Date().getFullYear();
        renderContributors();
        renderTagFacet(window.POSTS || []);
        const q = $("#q");
        if (q) q.addEventListener("input", () => { state.q = q.value; update(); });
        const range = $("#range");
        if (range) range.addEventListener("change", e => { state.range = e.target.value; state.selId = null; update(); });
        const reset = $("#reset");
        if (reset) reset.addEventListener("click", () => {
            state.q = "";
            state.range = $("#range")?.value || "30";
            state.tzLocal = false;
            state.tagFilters = new Set();
            state.authorFilters = new Set();
            state.selId = null;
            if ($("#q")) $("#q").value = "";
            document.querySelectorAll(".chip.active").forEach(ch => ch.classList.remove("active"));
            document.querySelectorAll(".facet .tag.active").forEach(t => t.classList.remove("active"));
            update();
        });

        setupThemePicker();
        update();
        setResponsiveMode();
    }

    function setResponsiveMode() {
        const isMobile = window.innerWidth <= 720;
        const table = document.querySelector("table.events");
        if (!table) return;
        const resizers = table.querySelectorAll(".resizer");
        if (isMobile) resizers.forEach(r => r.style.display = "none");
        else resizers.forEach(r => r.style.display = "");
    }
    window.addEventListener("resize", setResponsiveMode);

    document.addEventListener("DOMContentLoaded", init);
})();
