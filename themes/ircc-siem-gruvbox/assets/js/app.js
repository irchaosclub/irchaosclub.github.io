(function () {
    // ---------- utils ----------
    const $ = (s, el = document) => el.querySelector(s);
    const $$ = (s, el = document) => [...el.querySelectorAll(s)];
    const toDate = s => new Date(s);
    const pad = n => (n < 10 ? "0" + n : "" + n);
    const esc = s => String(s).replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
    const make = (tag, props = {}, kids = []) => {
        const el = Object.assign(document.createElement(tag), props);
        (Array.isArray(kids) ? kids : [kids]).forEach(k => k && el.append(k));
        return el;
    };

    const fmtDateUTC = d => (d instanceof Date && !isNaN(d)) ? `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}` : "—";
    const withinRange = (d, range) => range === "all" ? true : d >= new Date(Date.now() - parseInt(range, 10) * 86400000);
    const parseQuery = text => {
        const out = { any: [], tag: [], author: [], title: [] };
        text.trim().split(/\s+/).filter(Boolean).forEach(t => {
            const [k, v] = t.split(":");
            if (v && out[k]) out[k].push(v.toLowerCase());
            else out.any.push(t.toLowerCase());
        });
        return out;
    };

    // ---------- state ----------
    const state = {
        q: "",
        range: "all",
        tagFilters: new Set(),
        authorFilters: new Set(),
        selId: null,
        tzLocal: false, // kept for compatibility
    };

    // ---------- footer-safe FAB ----------
    function preventFabOverFooter(fab) {
        const footer = $('.foot');
        if (!fab || !footer) return;
        const BASE = 16;
        const update = () => {
            const fr = footer.getBoundingClientRect();
            const overlap = Math.max(0, window.innerHeight - fr.top);
            fab.style.setProperty('--fab-bottom', `${(overlap ? overlap + BASE : BASE)}px`);
        };
        update();
        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
        new IntersectionObserver(update, { threshold: [0, 1] }).observe(footer);
    }

    // ---------- data-driven UI ----------
    function renderContributors() {
        const wrap = $("#contributors");
        if (!wrap) return;
        wrap.innerHTML = "";
        (window.CONTRIBUTORS || []).forEach(name => {
            const key = name.toLowerCase();
            const chip = make("button", {
                type: "button",
                className: `chip${state.authorFilters.has(key) ? " active" : ""}`,
                innerHTML: `<span class="dot"></span><span>${esc(name)}</span>`
            });
            chip.dataset.author = key;
            chip.addEventListener("click", () => {
                const k = chip.dataset.author;
                (state.authorFilters.has(k) ? state.authorFilters.delete(k) : state.authorFilters.add(k));
                chip.classList.toggle("active");
                update();
            });
            wrap.append(chip);
        });
    }

    function renderTagFacet(posts) {
        const wrap = $("#facet-tags");
        if (!wrap) return;
        const src = state.range === "all" ? posts : posts.filter(p => withinRange(toDate(p.time), state.range));
        const counts = new Map();
        src.forEach(p => (p.tags || []).forEach(t => counts.set(t, (counts.get(t) || 0) + 1)));
        const items = [...counts.entries()].sort((a, b) => b[1] - a[1]);

        wrap.innerHTML = "";
        items.forEach(([tag, ct]) => {
            const key = tag.toLowerCase();
            const btn = make("button", { type: "button", className: `tag${state.tagFilters.has(key) ? " active" : ""}`, textContent: tag });
            btn.dataset.tag = key;
            btn.addEventListener("click", () => {
                (state.tagFilters.has(key) ? state.tagFilters.delete(key) : state.tagFilters.add(key));
                btn.classList.toggle("active");
                update();
            });
            const row = make("div", { className: "row" }, [btn, make("div", { className: "ct", textContent: String(ct) })]);
            wrap.append(row);
        });
    }

    function matchPost(p) {
        const t = toDate(p.time);
        if (!withinRange(t, state.range)) return false;

        const tags = (p.tags || []).map(x => x.toLowerCase());
        for (const tag of state.tagFilters) if (!tags.includes(tag)) return false;

        if (state.authorFilters.size) {
            const authors = (p.authors || []).map(a => a.toLowerCase());
            if (![...state.authorFilters].some(a => authors.includes(a))) return false;
        }
        if (!state.q) return true;

        const q = parseQuery(state.q);
        const title = (p.title || "").toLowerCase();
        const authors = (p.authors || []).map(x => x.toLowerCase());
        const desc = (p.description || p.excerpt || "").toLowerCase();
        const excerpt = (p.excerpt || "").toLowerCase();

        if (q.tag.length && !q.tag.every(tg => tags.includes(tg))) return false;
        if (q.author.length && !q.author.every(a => authors.some(x => x.includes(a)))) return false;
        if (q.title.length && !q.title.every(s => title.includes(s))) return false;

        if (q.any.length && !q.any.every(w =>
            title.includes(w) ||
            authors.some(a => a.includes(w)) ||
            tags.some(tg => tg.includes(w)) ||
            desc.includes(w) ||
            excerpt.includes(w)
        )) return false;

        return true;
    }

    function renderHistogram(posts) {
        const hist = $("#hist"); if (!hist) return;
        hist.innerHTML = "";

        const days = state.range === "all" ? 30 : parseInt(state.range, 10);
        const now = new Date();
        const byDay = new Map();

        for (let i = days - 1; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 86400000);
            byDay.set(fmtDateUTC(d), 0);
        }
        posts.forEach(p => {
            const key = fmtDateUTC(toDate(p.time));
            if (byDay.has(key)) byDay.set(key, byDay.get(key) + 1);
        });

        const vals = [...byDay.values()];
        const max = Math.max(1, ...vals);
        vals.forEach(v => {
            const h = Math.max(3, Math.round((v / max) * 100));
            hist.append(make("div", { className: "bar", title: `${v} post${v === 1 ? "" : "s"}`, style: `height:${h}%` }));
        });

        $("#countLabel").textContent = `${posts.length} post${posts.length === 1 ? "" : "s"}`;
        $("#dateLabel").textContent = state.range === "all" ? "last 30d view" : `window: last ${state.range}d`;
    }

    function renderTable(posts) {
        const tbody = $("#rows"); if (!tbody) return;
        tbody.innerHTML = "";

        posts.sort((a, b) => toDate(b.time) - toDate(a.time));

        posts.forEach(p => {
            const tr = make("tr"); tr.dataset.id = p.id;
            const authorsHTML = (p.authors || []).map(a => `<span class="pill">${esc(a)}</span>`).join(" ");
            const tagsHTML = (p.tags || []).slice(0, 3).map(t => `<span class="tag">${esc(t)}</span>`).join("");
            const aAttrs = p.type === "external"
                ? `href="${esc(p.link)}" target="_blank" rel="noopener"`
                : `href="${esc(p.link)}"`;

            tr.innerHTML = `
        <td class="col-time"><span class="ts">${fmtDateUTC(new Date(p.time))}</span></td>
        <td class="col-authors">${authorsHTML}</td>
        <td class="col-title"><a ${aAttrs}>${esc(p.title)}</a>${p.type === "external" ? '<span class="pill sev-warn" style="margin-left:8px">external</span>' : ''}</td>
        <td class="col-tags">${tagsHTML}</td>
      `;
            tr.querySelectorAll(".col-title .tag").forEach(n => n.remove());
            tr.addEventListener("click", () => {
                state.selId = p.id;
                $$("#rows tr").forEach(r => r.classList.remove("sel"));
                tr.classList.add("sel");
                renderDetails(p);
            });
            tbody.append(tr);
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
        const box = $("#details"); if (!box) return;
        const text = (p.description || p.excerpt || "").trim();
        const safe = text ? text.replace(/</g, "&lt;") : '<span style="color:var(--muted)">No description available.</span>';
        box.innerHTML = `
      <h3>${esc(p.title || "")}</h3>
      <div class="kv">
        <div class="k">author</div><div>${(p.authors || []).map(esc).join(", ")}</div>
        <div class="k">tags</div><div class="tags">${(p.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join("")}</div>
        <div class="k">type</div><div>${esc(p.type || "")}</div>
      </div>
      <div class="excerpt" id="ex">${safe}</div>
      <div style="margin-top:10px">
        ${p.type === "external"
                ? `<a class="dl" href="${esc(p.link)}" target="_blank" rel="noopener">Open external post ↗</a>`
                : `<a class="dl" href="${esc(p.link)}">Open post</a>`}
      </div>
    `;
    }

    // ---------- sizing ----------
    function sizeAuthorsAndTagsColumns() {
        const colAuthors = $('#col-authors');
        const colTags = $('#col-tags');
        const colTime = $('#col-time');
        const colTitle = $('#col-title');
        const tbody = $('#rows');
        const table = $('table.events');
        if (!colAuthors || !colTags || !tbody || !table) return;

        const hasFixedTags = getComputedStyle(table).getPropertyValue('--tags-col-ch').trim() !== '';

        let maxAuthor = 0;
        $$('#rows td.col-authors .pill').forEach(p => maxAuthor = Math.max(maxAuthor, Math.ceil(p.getBoundingClientRect().width)));
        const PAD = 20;
        const authorsW = Math.max(120, maxAuthor + PAD);

        let maxTagsContent = 0;
        $$('#rows td.col-tags').forEach(td => {
            const pills = [...td.querySelectorAll('.tag')].slice(0, 3);
            if (!pills.length) return;
            const probe = make('div', { style: 'position:absolute;visibility:hidden;left:-9999px;top:-9999px;white-space:nowrap;display:flex;gap:6px;' }, pills.map(p => p.cloneNode(true)));
            document.body.appendChild(probe);
            maxTagsContent = Math.max(maxTagsContent, Math.ceil(probe.getBoundingClientRect().width));
            probe.remove();
        });
        const tagsWRaw = maxTagsContent ? (maxTagsContent + PAD - 1) : 120;

        const W = table.getBoundingClientRect().width;
        const timeW = (colTime?.getBoundingClientRect().width || 0);
        const minTitle = 240;
        const tagsW = Math.max(120, Math.min(tagsWRaw, W - timeW - authorsW - minTitle));

        colAuthors.style.width = authorsW + 'px';
        if (!hasFixedTags) colTags.style.width = tagsW + 'px';
        else colTags.style.width = '';
        if (colTitle) colTitle.style.width = '';
    }
    let _rszTimer;
    window.addEventListener('resize', () => { clearTimeout(_rszTimer); _rszTimer = setTimeout(sizeAuthorsAndTagsColumns, 120); });

    // ---------- theme ----------
    function setupThemePicker() {
        const sel = $("#themePicker");
        if (!sel) return;
        sel.addEventListener("change", e => applyTheme(e.target.value));
        applyTheme(localStorage.getItem("irccTheme") || "gruvbox-dark");
    }
    function applyTheme(name) {
        document.documentElement.dataset.theme = name;
        try { localStorage.setItem("irccTheme", name); } catch { }
        const sel = $("#themePicker"); if (sel) sel.value = name;
    }

    // ---------- filters drawer ----------
    function wireFiltersDrawer() {
        const fab = make('button', { className: 'filters-fab', type: 'button', textContent: 'Filters' });
        fab.setAttribute('aria-expanded', 'false');
        document.body.appendChild(fab);
        preventFabOverFooter(fab);

        const overlay = make('div', { className: 'filters-overlay', style: 'display:none' });
        document.body.appendChild(overlay);

        const open = () => { document.body.classList.add('filters-open'); fab.textContent = 'Close'; fab.setAttribute('aria-expanded', 'true'); overlay.style.display = 'block'; };
        const close = () => { document.body.classList.remove('filters-open'); fab.textContent = 'Filters'; fab.setAttribute('aria-expanded', 'false'); overlay.style.display = 'none'; };

        fab.addEventListener('click', () => (document.body.classList.contains('filters-open') ? close() : open()));
        overlay.addEventListener('click', close);
        window.addEventListener('keydown', e => e.key === 'Escape' && close());

        const mq = window.matchMedia('(min-width: 901px)');
        const handle = () => { if (mq.matches) close(); };
        mq.addEventListener ? mq.addEventListener('change', handle) : mq.addListener(handle);
    }

    // ---------- responsive helpers ----------
    function setResponsiveMode() {
        const isMobile = window.innerWidth <= 720;
        const table = $("table.events"); if (!table) return;
        $$(".resizer", table).forEach(r => r.style.display = isMobile ? "none" : "");
    }
    window.addEventListener("resize", setResponsiveMode);

    // ---------- main ----------
    function update() {
        const posts = (window.POSTS || []).map(p => ({ ...p, authors: p.authors || (p.author ? [p.author] : []) }));
        const filtered = posts.filter(matchPost);
        renderHistogram(filtered);
        renderTagFacet(posts);
        renderTable(filtered);
    }

    function init() {
        const y = $("#yy"); if (y) y.textContent = new Date().getFullYear();
        renderContributors();
        renderTagFacet(window.POSTS || []);

        const q = $("#q"); if (q) q.addEventListener("input", () => { state.q = q.value; update(); });

        const rangeSel = $("#range");
        if (rangeSel) {
            rangeSel.value = "all";
            state.range = "all";
            rangeSel.addEventListener("change", e => { state.range = e.target.value || "all"; state.selId = null; update(); });
        }

        const reset = $("#reset");
        if (reset) reset.addEventListener("click", () => {
            state.q = "";
            state.range = $("#range")?.value || "all";
            state.tzLocal = false;
            state.tagFilters.clear();
            state.authorFilters.clear();
            state.selId = null;
            if (q) q.value = "";
            $$(".chip.active").forEach(ch => ch.classList.remove("active"));
            $$(".facet .tag.active").forEach(t => t.classList.remove("active"));
            update();
        });

        setupThemePicker();
        update();
        setResponsiveMode();
        wireFiltersDrawer();
    }

    document.addEventListener("DOMContentLoaded", init);
})();
