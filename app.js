(() => {
  "use strict";

  const app = document.getElementById("app");
  const notice = document.getElementById("notice");
  const storageKey = "national-dex-tracker-statuses-v1";
  const statusOrder = ["missing", "owned", "desired"];
  const statusLabel = { missing: "Missing", owned: "Seen", desired: "Caught" };
  const statusFromLabel = {
    missing: "missing",
    seen: "owned",
    owned: "owned",
    caught: "desired",
    desired: "desired",
  };
  let records = [];
  let visibleCount = 240;
  let pendingImport = [];

  const escapeHtml = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[character]);

  const safeSpriteUrl = (value) => {
    try {
      const url = new URL(String(value || ""));
      return url.protocol === "https:" ? url.href : "";
    } catch {
      return "";
    }
  };

  function showNotice(message, kind = "") {
    notice.textContent = message;
    notice.className = `notice ${kind}`.trim();
    notice.hidden = false;
    window.clearTimeout(showNotice.timer);
    showNotice.timer = window.setTimeout(() => {
      notice.hidden = true;
    }, 6000);
  }

  function readSavedStatuses() {
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  function saveStatuses() {
    const statuses = Object.fromEntries(records.map((pokemon) => [pokemon.dexNumber, pokemon.status]));
    localStorage.setItem(storageKey, JSON.stringify(statuses));
  }

  function normalizeStatus(value) {
    const key = String(value ?? "").trim().toLowerCase();
    return statusFromLabel[key] || null;
  }

  function formatDex(number) {
    return `#${String(number).padStart(3, "0")}`;
  }

  function cardMarkup(pokemon) {
    const imageUrl = safeSpriteUrl(pokemon.spriteUrl);
    const sprite = imageUrl
      ? `<img src="${escapeHtml(imageUrl)}" alt="" loading="lazy" />`
      : `<span class="sprite-placeholder" aria-hidden="true">?</span>`;
    return `<button class="pokemon-card" type="button" data-action="cycle" data-dex="${pokemon.dexNumber}" data-status="${pokemon.status}" title="Click to change status">
      <span class="dex">${formatDex(pokemon.dexNumber)}</span>
      ${sprite}
      <span class="name">${escapeHtml(pokemon.name)}</span>
      <span class="status">${statusLabel[pokemon.status]}</span>
    </button>`;
  }

  function pageHead(eyebrow, title, subtitle) {
    return `<header class="page-head"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p class="subtitle">${subtitle}</p></div></header>`;
  }

  function renderTracker() {
    const search = document.getElementById("tracker-search")?.value.trim().toLowerCase() || "";
    const filter = document.getElementById("tracker-status")?.value || "all";
    const sort = document.getElementById("tracker-sort")?.value || "dex";
    const filtered = records
      .filter((pokemon) => (!search || pokemon.name.toLowerCase().includes(search) || String(pokemon.dexNumber).includes(search)))
      .filter((pokemon) => filter === "all" || pokemon.status === filter)
      .sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : a.dexNumber - b.dexNumber);
    const shown = filtered.slice(0, visibleCount);
    const results = document.getElementById("tracker-results");
    const count = document.getElementById("tracker-count");
    if (!results || !count) return;
    count.textContent = `${filtered.length.toLocaleString()} Pokémon${filtered.length === 1 ? "" : ""}${filtered.length > shown.length ? ` · showing ${shown.length.toLocaleString()}` : ""}`;
    results.innerHTML = shown.length
      ? shown.map(cardMarkup).join("")
      : `<div class="empty-panel">No Pokémon match these filters.</div>`;
    const more = document.getElementById("show-more");
    if (more) more.hidden = shown.length >= filtered.length;
  }

  function trackerPage() {
    app.innerHTML = `${pageHead("COLLECTION", "National Pokédex", "Click any entry to cycle its status. Updates are saved in this browser, so you can keep working without a connection after the page has loaded.")}
      <div class="toolbar">
        <input id="tracker-search" class="field" type="search" placeholder="Search by name or Pokédex number" aria-label="Search Pokémon" />
        <select id="tracker-status" class="field" aria-label="Filter by status">
          <option value="all">All statuses</option><option value="missing">Missing</option><option value="owned">Seen</option><option value="desired">Caught</option>
        </select>
        <select id="tracker-sort" class="field" aria-label="Sort Pokémon">
          <option value="dex">Sort by Pokédex number</option><option value="name">Sort by name</option>
        </select>
      </div>
      <div class="summary-row"><span id="tracker-count"></span><div class="legend"><span><i></i>Missing</span><span class="seen"><i></i>Seen</span><span class="caught"><i></i>Caught</span></div></div>
      <div id="tracker-results" class="pokemon-grid"></div>
      <div class="summary-row" style="justify-content:center"><button id="show-more" class="button" type="button">Show more</button></div>`;
    visibleCount = 240;
    document.getElementById("tracker-search").addEventListener("input", renderTracker);
    document.getElementById("tracker-status").addEventListener("change", renderTracker);
    document.getElementById("tracker-sort").addEventListener("change", renderTracker);
    document.getElementById("show-more").addEventListener("click", () => {
      visibleCount += 240;
      renderTracker();
    });
    renderTracker();
  }

  function statsPage() {
    const counts = { missing: 0, owned: 0, desired: 0 };
    records.forEach((pokemon) => counts[pokemon.status]++);
    const complete = records.length ? (counts.desired / records.length) * 100 : 0;
    app.innerHTML = `${pageHead("AT A GLANCE", "Collection stats", "A live summary of the collection saved in this browser.")}
      <div class="stats-grid">
        <article class="stat-card"><div class="label">Total Pokémon</div><div class="value">${records.length.toLocaleString()}</div></article>
        <article class="stat-card"><div class="label">Caught</div><div class="value" style="color:var(--green)">${counts.desired.toLocaleString()}</div></article>
        <article class="stat-card"><div class="label">Seen</div><div class="value" style="color:var(--amber)">${counts.owned.toLocaleString()}</div></article>
        <article class="stat-card"><div class="label">Missing</div><div class="value">${counts.missing.toLocaleString()}</div></article>
      </div>
      <section class="panel panel-pad">
        <h2 class="panel-title">National Pokédex completion</h2>
        <p class="panel-copy">Caught Pokémon count toward completion.</p>
        <div class="progress-track"><div class="progress-bar" style="width:${Math.min(complete, 100)}%"></div></div>
        <div class="progress-label"><span>${counts.desired.toLocaleString()} caught</span><strong>${complete.toFixed(1)}%</strong></div>
      </section>`;
  }

  function sorterPage() {
    app.innerHTML = `${pageHead("BINDER TOOLS", "Card sorter", "Paste Pokémon names to put them in Pokédex order and estimate the binder page and side.")}
      <section class="panel panel-pad">
        <div class="form-grid">
          <div class="form-field span-2"><label for="sorter-names">Pokémon names</label><textarea id="sorter-names" class="field" placeholder="Pikachu&#10;Bulbasaur&#10;Charizard"></textarea><p class="help">Enter one name per line. Partial names are matched when there is a clear result.</p></div>
          <div class="form-field"><label for="sorter-cols">Columns per side</label><input id="sorter-cols" class="field" type="number" min="2" max="9" value="3" /></div>
          <div class="form-field"><label for="sorter-rows">Rows per side</label><input id="sorter-rows" class="field" type="number" min="2" max="9" value="3" /></div>
          <div class="span-2"><button id="sorter-submit" class="button primary" type="button">Sort cards</button></div>
        </div>
        <div id="sorter-results" class="results-list"></div>
      </section>`;
    document.getElementById("sorter-submit").addEventListener("click", () => {
      const names = document.getElementById("sorter-names").value.split(/\r?\n/).map((name) => name.trim()).filter(Boolean);
      const cols = Math.min(9, Math.max(2, Number(document.getElementById("sorter-cols").value) || 3));
      const rows = Math.min(9, Math.max(2, Number(document.getElementById("sorter-rows").value) || 3));
      const slots = cols * rows;
      const matches = [];
      const misses = [];
      names.forEach((name) => {
        const exact = records.find((pokemon) => pokemon.name.toLowerCase() === name.toLowerCase());
        const candidates = exact ? [exact] : records.filter((pokemon) => pokemon.name.toLowerCase().includes(name.toLowerCase()));
        if (candidates.length) matches.push({ query: name, pokemon: candidates[0] });
        else misses.push(name);
      });
      matches.sort((a, b) => a.pokemon.binderPosition - b.pokemon.binderPosition);
      const results = document.getElementById("sorter-results");
      results.innerHTML = matches.map(({ query, pokemon }) => {
        const index = Math.max(0, pokemon.binderPosition - 1);
        const page = Math.floor(index / (slots * 2)) + 1;
        const side = Math.floor(index / slots) % 2 === 0 ? "Front" : "Back";
        const note = query.toLowerCase() === pokemon.name.toLowerCase() ? "" : ` <small>matched from “${escapeHtml(query)}”</small>`;
        return `<div class="result-row"><span><strong>${formatDex(pokemon.dexNumber)} ${escapeHtml(pokemon.name)}</strong>${note}</span><small>Binder ${pokemon.binderPosition} · Page ${page} · ${side}</small></div>`;
      }).join("") + misses.map((name) => `<div class="result-row"><span>${escapeHtml(name)}</span><small>No match found</small></div>`).join("") || `<div class="empty-panel">Enter Pokémon names above to sort them.</div>`;
    });
  }

  function csvCell(value) {
    return `"${String(value ?? "").replace(/"/g, '""')}"`;
  }

  function csvText(rows) {
    return [
      ["dexNumber", "name", "status", "binderPosition"].map(csvCell).join(","),
      ...rows.map((pokemon) => [pokemon.dexNumber, pokemon.name, statusLabel[pokemon.status], pokemon.binderPosition].map(csvCell).join(",")),
    ].join("\r\n");
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function exportExcel() {
    if (!window.ExcelJS) {
      showNotice("The spreadsheet library has not loaded. Check your connection and reload the page.", "error");
      return;
    }
    try {
      const workbook = new window.ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("National Dex", { views: [{ state: "frozen", ySplit: 1 }] });
      sheet.columns = [
        { header: "Dex Number", key: "dexNumber", width: 13 },
        { header: "Name", key: "name", width: 24 },
        { header: "Status", key: "status", width: 16 },
        { header: "Binder Position", key: "binderPosition", width: 17 },
      ];
      sheet.addRows(records.map((pokemon) => ({
        dexNumber: pokemon.dexNumber,
        name: pokemon.name,
        status: statusLabel[pokemon.status],
        binderPosition: pokemon.binderPosition,
      })));
      sheet.autoFilter = "A1:D1";
      const bytes = await workbook.xlsx.writeBuffer();
      downloadBlob(new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "national-pokedex.xlsx");
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "The workbook could not be created.", "error");
    }
  }

  function csvMatrix(text) {
    const rows = [];
    let row = [];
    let cell = "";
    let quoted = false;
    const source = text.replace(/^\uFEFF/, "");
    for (let index = 0; index < source.length; index += 1) {
      const character = source[index];
      if (quoted) {
        if (character === '"' && source[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else if (character === '"') {
          quoted = false;
        } else {
          cell += character;
        }
      } else if (character === '"' && cell.length === 0) {
        quoted = true;
      } else if (character === ",") {
        row.push(cell);
        cell = "";
      } else if (character === "\n" || character === "\r") {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
        if (character === "\r" && source[index + 1] === "\n") index += 1;
      } else {
        cell += character;
      }
    }
    if (quoted) throw new Error("The CSV file has an unclosed quoted cell.");
    if (cell.length || row.length) {
      row.push(cell);
      rows.push(row);
    }
    return rows;
  }

  function matrixToObjects(matrix) {
    const headers = (matrix[0] || []).map((value) => String(value ?? ""));
    return matrix.slice(1).map((cells) => Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""])));
  }

  async function importRowsFromFile(file) {
    const extension = file.name.split(".").pop().toLowerCase();
    if (extension === "json") {
      const parsed = JSON.parse(await file.text());
      return Array.isArray(parsed) ? parsed : parsed.pokemon;
    }
    if (extension === "csv") return matrixToObjects(csvMatrix(await file.text()));
    if (extension !== "xlsx") throw new Error("Use an .xlsx workbook, .csv file, or .json file.");
    if (!window.ExcelJS) throw new Error("The spreadsheet library has not loaded. Check your connection and reload the page.");
    const workbook = new window.ExcelJS.Workbook();
    await workbook.xlsx.load(await file.arrayBuffer());
    const sheet = workbook.worksheets[0];
    if (!sheet) throw new Error("This file has no worksheet to read.");
    const matrix = [];
    sheet.eachRow({ includeEmpty: true }, (sourceRow) => {
      const cells = [];
      for (let column = 1; column <= sheet.columnCount; column += 1) {
        const cell = sourceRow.getCell(column);
        cells.push(cell.value == null ? "" : cell.text || cell.value);
      }
      matrix.push(cells);
    });
    if (!matrix.length) throw new Error("This workbook is empty.");
    return matrixToObjects(matrix);
  }

  function importExportPage() {
    app.innerHTML = `${pageHead("PORTABLE COLLECTION", "Import / Export", "Take your full National Dex with you. Excel and CSV files stay editable, and imported status changes are saved in this browser.")}
      <div class="form-grid">
        <section class="panel panel-pad">
          <p class="eyebrow">DOWNLOAD</p>
          <h2 class="panel-title">Export your collection</h2>
          <p class="panel-copy">Download all ${records.length.toLocaleString()} entries with their current status and binder position.</p>
          <div class="export-actions">
            <button id="export-xlsx" class="button primary" type="button">Download Excel</button>
            <button id="export-csv" class="button" type="button">Download CSV</button>
            <button id="export-json" class="button" type="button">Download JSON</button>
          </div>
        </section>
        <section class="panel panel-pad">
          <p class="eyebrow">UPLOAD</p>
          <h2 class="panel-title">Import status updates</h2>
          <p class="panel-copy">Upload an edited Excel, CSV, or JSON file. Only each Pokémon's status is changed; names and catalog data are left untouched.</p>
          <div class="form-field" style="margin-top:16px"><label for="import-file">Choose a file</label><input id="import-file" class="field" type="file" accept=".xlsx,.csv,.json" /></div>
          <p class="help">Required columns: dexNumber and status. Status can be Missing, Seen, or Caught. Blank status cells are ignored.</p>
          <div id="import-preview" class="results-list"></div>
          <div class="export-actions"><button id="confirm-import" class="button primary" type="button" disabled>Apply status changes</button></div>
        </section>
      </div>
      <p class="help" style="margin-top:18px">For spreadsheet files, keep the column headings from the exported file. An import preview appears before changes are saved.</p>`;
    document.getElementById("export-xlsx").addEventListener("click", () => { void exportExcel(); });
    document.getElementById("export-csv").addEventListener("click", () => downloadBlob(new Blob(["\\ufeff", csvText(records)], { type: "text/csv;charset=utf-8" }), "national-pokedex.csv"));
    document.getElementById("export-json").addEventListener("click", () => {
      const data = records.map((pokemon) => ({
        dexNumber: pokemon.dexNumber,
        name: pokemon.name,
        status: statusLabel[pokemon.status],
        binderPosition: pokemon.binderPosition,
      }));
      downloadBlob(new Blob([JSON.stringify({ generatedAt: new Date().toISOString(), pokemon: data }, null, 2)], { type: "application/json" }), "national-pokedex.json");
    });
    document.getElementById("import-file").addEventListener("change", async (event) => {
      pendingImport = [];
      document.getElementById("confirm-import").disabled = true;
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        const rows = await importRowsFromFile(file);
        const byDex = new Map(records.map((pokemon) => [pokemon.dexNumber, pokemon]));
        const updatesByDex = new Map();
        const conflictedDex = new Set();
        const errors = [];
        rows.forEach((row, index) => {
          const normalized = Object.fromEntries(Object.entries(row).map(([key, value]) => [key.toLowerCase().replace(/[^a-z0-9]/g, ""), value]));
          const dex = Number(normalized.dexnumber ?? normalized.dex ?? normalized.nationaldex);
          const rawStatus = normalized.status ?? normalized.collectionstatus;
          if (!Number.isInteger(dex) || !byDex.has(dex)) {
            errors.push(`Row ${index + 2}: unknown or invalid dex number.`);
            return;
          }
          if (conflictedDex.has(dex)) return;
          if (String(rawStatus ?? "").trim() === "") return;
          const status = normalizeStatus(rawStatus);
          if (!status) {
            errors.push(`Row ${index + 2}: status must be Missing, Seen, or Caught.`);
            return;
          }
          if (updatesByDex.has(dex) && updatesByDex.get(dex) !== status) {
            errors.push(`Row ${index + 2}: conflicting duplicate entry for dex #${dex}.`);
            updatesByDex.delete(dex);
            conflictedDex.add(dex);
            return;
          }
          updatesByDex.set(dex, status);
        });
        pendingImport = (errors.length ? [] : [...updatesByDex.entries()])
          .filter(([dex, status]) => byDex.get(dex).status !== status)
          .map(([dexNumber, status]) => ({ dexNumber, status }));
        const preview = document.getElementById("import-preview");
        const changed = pendingImport.slice(0, 8).map(({ dexNumber, status }) => {
          const pokemon = byDex.get(dexNumber);
          return `<div class="result-row"><span><strong>${formatDex(dexNumber)} ${escapeHtml(pokemon.name)}</strong></span><small>${statusLabel[pokemon.status]} → ${statusLabel[status]}</small></div>`;
        }).join("");
        const errorMarkup = errors.slice(0, 8).map((error) => `<div class="result-row"><span>${escapeHtml(error)}</span></div>`).join("");
        preview.innerHTML = `<div class="notice ${errors.length ? "error" : "success"}">${pendingImport.length} status change${pendingImport.length === 1 ? "" : "s"} ready${errors.length ? ` · ${errors.length} row error${errors.length === 1 ? "" : "s"}` : ""}.</div>${changed}${pendingImport.length > 8 ? `<p class="help">And ${pendingImport.length - 8} more changes.</p>` : ""}${errorMarkup}`;
        document.getElementById("confirm-import").disabled = pendingImport.length === 0;
      } catch (error) {
        showNotice(error instanceof Error ? error.message : "This file could not be read.", "error");
      }
    });
    document.getElementById("confirm-import").addEventListener("click", () => {
      if (!pendingImport.length) return;
      const statuses = readSavedStatuses();
      pendingImport.forEach(({ dexNumber, status }) => {
        const pokemon = records.find((entry) => entry.dexNumber === dexNumber);
        if (pokemon) pokemon.status = status;
        statuses[dexNumber] = status;
      });
      localStorage.setItem(storageKey, JSON.stringify(statuses));
      const count = pendingImport.length;
      pendingImport = [];
      importExportPage();
      showNotice(`Saved ${count} status change${count === 1 ? "" : "s"} in this browser.`, "success");
    });
  }

  function renderRoute() {
    const route = (window.location.hash.slice(1).split("/")[0] || "tracker");
    document.querySelectorAll(".nav a").forEach((link) => link.classList.toggle("active", link.dataset.route === route));
    if (route === "stats") statsPage();
    else if (route === "sorter") sorterPage();
    else if (route === "import-export") importExportPage();
    else trackerPage();
  }

  async function start() {
    try {
      const response = await fetch("./data/pokemon.json");
      if (!response.ok) throw new Error("The Pokédex data file could not be loaded. Make sure data/pokemon.json is included.");
      const payload = await response.json();
      const source = Array.isArray(payload) ? payload : payload.pokemon;
      if (!Array.isArray(source)) throw new Error("The data file has an unsupported format.");
      const saved = readSavedStatuses();
      records = source.map((pokemon) => {
        const initialStatus = normalizeStatus(pokemon.status) || "missing";
        const localStatus = normalizeStatus(saved[pokemon.dexNumber]);
        return {
          dexNumber: Number(pokemon.dexNumber),
          name: String(pokemon.name || `Pokémon ${pokemon.dexNumber}`),
          binderPosition: Number(pokemon.binderPosition || pokemon.dexNumber),
          spriteUrl: pokemon.spriteUrl || "",
          status: localStatus || initialStatus,
        };
      }).filter((pokemon) => Number.isInteger(pokemon.dexNumber) && pokemon.dexNumber > 0);
      window.addEventListener("hashchange", renderRoute);
      document.addEventListener("click", (event) => {
        const button = event.target.closest('[data-action="cycle"]');
        if (!button) return;
        const pokemon = records.find((entry) => entry.dexNumber === Number(button.dataset.dex));
        if (!pokemon) return;
        const index = statusOrder.indexOf(pokemon.status);
        pokemon.status = statusOrder[(index + 1) % statusOrder.length];
        saveStatuses();
        renderRoute();
      });
      renderRoute();
    } catch (error) {
      app.innerHTML = `<div class="empty-panel">${escapeHtml(error instanceof Error ? error.message : "Could not load the Pokédex.")}</div>`;
    }
  }

  start();
})();
