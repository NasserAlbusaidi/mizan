(function () {
  const state = { window: "30", timer: null };

  // ---- formatting ----
  const esc = (s) =>
    String(s == null ? "" : s).replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
  const money = (n) => {
    const a = Math.abs(n);
    if (a >= 1000) return "$" + (n / 1000).toFixed(1) + "k";
    if (a >= 100) return "$" + n.toFixed(0);
    return "$" + n.toFixed(2);
  };
  const signedMoney = (n) => (n > 0 ? "+" + money(n) : n < 0 ? "-" + money(Math.abs(n)) : "$0.00");
  const signedNumber = (n) => (n > 0 ? "+" + n : String(n));
  const signedPct = (n) => {
    if (n == null) return "new";
    const value = (Math.abs(n) * 100).toFixed(1) + "%";
    return n > 0 ? "+" + value : n < 0 ? "-" + value : "0.0%";
  };
  const tok = (n) => {
    if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
    if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1) + "k";
    return String(n);
  };
  const pct = (x) => (x * 100).toFixed(1) + "%";
  const list = (items, fallback = "none") => (items && items.length ? items.join(", ") : fallback);
  const budgetLabel = (value) => (value == null ? "unset" : money(value));
  const weeklyReviewCommand = () => "mizan --weekly";
  const PRICED_MODEL_FAMILIES = ["fable", "mythos", "opus", "sonnet", "haiku"];
  const setCopyState = (label) => {
    const btn = document.getElementById("copy-report");
    btn.textContent = label;
    window.clearTimeout(btn._mzResetTimer);
    if (label !== "Copy report") {
      btn._mzResetTimer = window.setTimeout(() => {
        btn.textContent = "Copy report";
      }, 2200);
    }
  };
  const setDownloadState = (label) => {
    const btn = document.getElementById("download-report");
    btn.textContent = label;
    window.clearTimeout(btn._mzResetTimer);
    if (label !== "Save report") {
      btn._mzResetTimer = window.setTimeout(() => {
        btn.textContent = "Save report";
      }, 2200);
    }
  };
  const setCsvState = (label) => {
    const btn = document.getElementById("download-csv");
    btn.textContent = label;
    window.clearTimeout(btn._mzResetTimer);
    if (label !== "Save CSV") {
      btn._mzResetTimer = window.setTimeout(() => {
        btn.textContent = "Save CSV";
      }, 2200);
    }
  };

  // model -> color
  const MODEL_COLORS = [
    ["fable", "#b98bff"],
    ["opus", "#e3b259"],
    ["sonnet", "#3ddc97"],
    ["haiku", "#5b9dff"],
  ];
  const modelColor = (m) => {
    for (const [k, c] of MODEL_COLORS) if (m.includes(k)) return c;
    return "#6b7488";
  };
  const modelShort = (m) =>
    m
      .replace(/^claude-/, "")
      .replace(/-\d{8}$/, "")
      .replace(/<|>/g, "");

  // ---- fetch + render ----
  async function load() {
    const refreshBtn = document.getElementById("refresh");
    refreshBtn.classList.add("spin");
    try {
      const res = await fetch(`/api/data?window=${state.window}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      // Reveal the dashboard BEFORE rendering so canvases have a layout width
      // (a display:none canvas reports clientWidth 0, which breaks chart sizing).
      document.getElementById("loading").hidden = true;
      document.getElementById("error").hidden = true;
      document.getElementById("dashboard").hidden = false;
      render(data);
    } catch (err) {
      const el = document.getElementById("error");
      el.textContent = "Failed to load: " + err.message;
      el.hidden = false;
      document.getElementById("loading").hidden = true;
    } finally {
      refreshBtn.classList.remove("spin");
    }
  }

  function render(d) {
    window._mz = d; // cache for resize redraws
    renderBriefing(d);
    renderActions(d);
    renderKpis(d);
    renderLeaks(d);
    renderProjectChanges(d);
    renderAccounts(d);
    MizanCharts.drawDaily(document.getElementById("daily-chart"), d.days);
    renderModels(d);
    renderCache(d);
    renderProjects(d);
    renderSessions(d);
    renderFooter(d);
    const dt = new Date(d.generatedAt);
    document.getElementById("updated").textContent =
      "updated " + dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function renderBriefing(d) {
    const title = document.getElementById("brief-title");
    const copy = document.getElementById("brief-copy");
    const stats = d.stats || {};
    const accounts = Object.values(stats.accounts || {});
    const existingAccounts = accounts.filter((a) => a.exists);
    const missingAccounts = (d.config?.accounts || []).filter((a) => !a.exists).map((a) => a.account);

    if (d.config?.demo) {
      title.textContent = "Demo data is loaded";
      copy.textContent =
        "This sample shows leaks, burn rate, cache savings, and project concentration without reading your transcript folders.";
    } else if (!d.totals.reqs) {
      title.textContent = "No Claude Code usage found yet";
      copy.textContent =
        "Mizan is running, but the current transcript folders did not produce usage records for this window.";
    } else if (d.leaks.count > 0) {
      title.textContent = `${d.leaks.count} cross-account leak${d.leaks.count === 1 ? "" : "s"} need attention`;
      copy.textContent =
        `${money(d.leaks.totals.work_pays_personal + d.leaks.totals.personal_pays_work)} appears billed to the wrong account in this window.`;
    } else {
      title.textContent = "Your current window is clean";
      copy.textContent =
        `${tok(d.totals.reqs)} requests scanned across ${existingAccounts.length || 0} account folder${existingAccounts.length === 1 ? "" : "s"} with no account leaks detected.`;
    }

    const cards = [
      ["Mode", d.config?.demo ? "demo sample" : "real transcripts"],
      ["Access", d.config?.localOnly ? "local-only" : "network-accessible"],
      ["Host", d.config?.host || "127.0.0.1"],
      ["Config", d.config?.configFile?.exists ? d.config.configFile.path : "not created"],
      ["Scanned", `${stats.files || 0} transcript file${stats.files === 1 ? "" : "s"}`],
      ["Cache", d.config?.cacheFile ? d.config.cacheFile.replace(/^.*\/\.mizan\//, "~/.mizan/") : "~/.mizan/cache.json"],
      ["Work markers", list(d.config?.workMarkers, "not configured")],
      ["Pricing", d.pricing?.checkedAt ? `checked ${d.pricing.checkedAt}` : "static estimate"],
    ];
    if (d.config?.budgets?.daily || d.config?.budgets?.monthly) {
      cards.push([
        "Budgets",
        `day ${budgetLabel(d.config.budgets.daily)} · month ${budgetLabel(d.config.budgets.monthly)}`,
      ]);
    }
    if (missingAccounts.length) cards.push(["Missing", missingAccounts.join(" + ")]);

    document.getElementById("trust-grid").innerHTML = cards
      .map(([label, value]) => `<div class="trust-item"><div>${esc(label)}</div><strong>${esc(value)}</strong></div>`)
      .join("");
  }

  function renderActions(d) {
    const actions = buildActions(d);
    document.getElementById("actions").innerHTML =
      `<div class="panel-head"><h2>Action queue</h2><span class="hint">${actions.length} item${actions.length === 1 ? "" : "s"}</span></div>` +
      `<div class="action-list">${actions.map(renderAction).join("")}</div>`;
  }

  function buildActions(d) {
    const actions = [];
    const missingAccounts = (d.config?.accounts || []).filter((a) => !a.exists);
    const topProject = d.projects && d.projects[0];
    const unpricedModels = findUnpricedModels(d.models || []);

    if (d.config?.demo) {
      actions.push({
        tone: "good",
        title: "Demo mode is active",
        body: "Run mizan without --demo to scan real transcripts, or use mizan --set-transcripts personal=/path work=/path for custom locations.",
      });
    }

    if (d.config?.localOnly === false) {
      actions.push({
        tone: "warn",
        title: "Dashboard is network-accessible",
        body: `Mizan is bound to ${d.config.host || "a non-local host"}. Use this only on trusted networks because transcript-derived spending data is visible through the local server.`,
      });
    }

    if (!d.totals.reqs) {
      actions.push({
        tone: "good",
        title: "Preview demo data first",
        body: "Open the sample dashboard to see leak detection, burn rate, cache savings, and report copy without reading local transcripts.",
        command: "mizan --demo",
      });
      actions.push({
        tone: "neutral",
        title: "Run setup diagnostics",
        body: `Check whether Mizan can see the expected transcript folders: ${list((d.config?.accounts || []).map((a) => a.dir))}.`,
        command: "mizan --setup",
      });
      actions.push({
        tone: "danger",
        title: "Save transcript folders",
        body: "Persist custom personal/work project folders when Claude Code transcripts live outside the defaults.",
        command: "mizan --set-transcripts personal=/path work=/path",
      });
      return actions;
    }

    if (d.leaks.count > 0) {
      actions.push({
        tone: "danger",
        title: "Stop the account leak first",
        body: `Largest leaking session is ${money(d.leaks.sessions[0]?.cost || 0)} on ${d.leaks.sessions[0]?.account || "unknown"} for ${d.leaks.sessions[0]?.project || "unknown project"}. Switch the session to the right Claude account. If a flagged path is really work, add a work marker.`,
        command: "mizan --add-work-marker /Clients/",
      });
    } else {
      actions.push({
        tone: "good",
        title: "No cross-account leaks in this window",
        body: "Keep the dashboard open during long agent runs; it refreshes every 15 seconds.",
      });
    }

    const spendJump = spendJumpAction(d.comparison);
    if (spendJump) actions.push(spendJump);

    actions.push({
      tone: "neutral",
      title: "Weekly review command",
      body: "Print a redacted Markdown report for notes, reimbursements, or a Friday spend review.",
      command: weeklyReviewCommand(),
    });
    actions.push({
      tone: "neutral",
      title: "Make Mizan a weekly habit",
      body: "Print cron, launchd, report, and privacy-check commands you can save beside generated reports.",
      command: "mizan --setup-kit",
    });

    if (unpricedModels.length) {
      actions.push({
        tone: "warn",
        title: "Unpriced model usage",
        body: `Totals may be understated until pricing is added for ${unpricedModels
          .map((item) => `${modelShort(item.model)} (${item.reqs} reqs)`)
          .join(", ")}.`,
      });
    }

    const dailyBudget = d.config?.budgets?.daily;
    const monthlyBudget = d.config?.budgets?.monthly;
    if (dailyBudget && d.burn.today >= dailyBudget) {
      actions.push({
        tone: "danger",
        title: "Daily budget crossed",
        body: `${money(d.burn.today)} spent today against a ${money(dailyBudget)} daily budget.`,
      });
    } else if (dailyBudget && d.burn.today >= dailyBudget * 0.8) {
      actions.push({
        tone: "warn",
        title: "Daily budget is close",
        body: `${money(d.burn.today)} spent today; ${money(Math.max(0, dailyBudget - d.burn.today))} left before ${money(dailyBudget)}.`,
      });
    }

    if (monthlyBudget && d.burn.projected30d >= monthlyBudget) {
      actions.push({
        tone: "danger",
        title: "Monthly projection is over budget",
        body: `At the current 7-day rate, this projects to ${money(d.burn.projected30d)} against ${money(monthlyBudget)}.`,
      });
    } else if (monthlyBudget && d.burn.projected30d >= monthlyBudget * 0.8) {
      actions.push({
        tone: "warn",
        title: "Monthly projection is near budget",
        body: `${money(d.burn.projected30d)} projected against ${money(monthlyBudget)}.`,
      });
    } else if (!monthlyBudget && d.burn.projected30d >= 100) {
      actions.push({
        tone: "warn",
        title: "Monthly burn is worth watching",
        body: `Your current 7-day average projects to ${money(d.burn.projected30d)} over 30 days. Track it with mizan --set-budget monthly=${Math.ceil(d.burn.projected30d)}.`,
      });
    }

    if (topProject && d.totals.cost > 0 && topProject.cost / d.totals.cost >= 0.45) {
      actions.push({
        tone: "neutral",
        title: "One project dominates this window",
        body: `${topProject.display} accounts for ${pct(topProject.cost / d.totals.cost)} of spend.`,
      });
    }

    for (const account of missingAccounts) {
      actions.push({
        tone: "neutral",
        title: `${account.account} account folder was not found`,
        body: `${account.dir} does not exist. That is fine for one-account users; otherwise run mizan --set-transcripts ${account.account}=/path/to/projects.`,
      });
    }

    actions.push({
      tone: "neutral",
      title: "Need a scriptable snapshot?",
      body: `Run mizan --json --window ${state.window} to export the same rollup without opening the dashboard.`,
    });

    return actions.slice(0, 5);
  }

  function spendJumpAction(comparison) {
    if (!comparison || !comparison.windowDays) return null;
    const deltaCost = comparison.delta?.cost || 0;
    const deltaPct = comparison.delta?.costPct ?? null;
    const materialJump = deltaCost >= 5 && (deltaPct == null || deltaPct >= 0.25);
    if (!materialJump) return null;

    return {
      tone: "warn",
      title: "Spend jumped vs previous window",
      body: `${signedMoney(deltaCost)} (${signedPct(deltaPct)}) versus the previous ${comparison.windowDays}d. Run a report to see which projects moved it.`,
      command: `mizan --report --window ${comparison.windowDays}`,
    };
  }

  function findUnpricedModels(models) {
    return models.filter((entry) => {
      const model = String(entry.model || "");
      if (!model || model === "<synthetic>") return false;
      const tokens = (entry.input || 0) + (entry.cc || 0) + (entry.cr || 0) + (entry.output || 0);
      if (tokens <= 0) return false;
      return !PRICED_MODEL_FAMILIES.some((family) => model.includes(family));
    });
  }

  function renderAction(action) {
    const command = action.command
      ? `<div class="action-command"><code>${esc(action.command)}</code><button type="button" class="mini-copy" data-copy-command="${esc(action.command)}" title="Copy command">Copy</button></div>`
      : "";
    return (
      `<article class="action ${esc(action.tone)}">` +
      `<div class="action-dot"></div>` +
      `<div><h3>${esc(action.title)}</h3><p>${esc(action.body)}</p>${command}</div>` +
      `</article>`
    );
  }

  function renderKpis(d) {
    const winLabel = d.window.days ? `last ${d.window.days}d` : "all-time";
    const dailyBudget = d.config?.budgets?.daily;
    const monthlyBudget = d.config?.budgets?.monthly;
    const spendComparison = formatSpendComparison(d.comparison);
    const requestComparison = formatRequestComparison(d.comparison);
    const cards = [
      {
        label: `Spend · ${winLabel}`,
        value: money(d.totals.cost),
        hero: true,
        sub: spendComparison || tok(d.totals.output) + " output tokens",
      },
      {
        label: "Today",
        value: money(d.burn.today),
        sub: dailyBudget ? `${pct(Math.min(1, d.burn.today / dailyBudget))} of ${money(dailyBudget)}` : "so far",
      },
      { label: "Burn / day", value: money(d.burn.perDay), sub: "7-day average" },
      {
        label: "Projected / mo",
        value: money(d.burn.projected30d),
        sub: monthlyBudget ? `${pct(Math.min(1, d.burn.projected30d / monthlyBudget))} of ${money(monthlyBudget)}` : "at current rate",
      },
      { label: "Requests", value: tok(d.totals.reqs), sub: requestComparison || `${d.models.length} models` },
    ];
    document.getElementById("kpis").innerHTML = cards
      .map(
        (c) =>
          `<div class="kpi${c.hero ? " hero" : ""}"><div class="label">${esc(c.label)}</div>` +
          `<div class="value${c.hero ? " brass" : ""}">${esc(c.value)}</div>` +
          `<div class="sub">${esc(c.sub)}</div></div>`,
      )
      .join("");
  }

  function formatSpendComparison(comparison) {
    if (!comparison || !comparison.windowDays) return "";
    return `${signedMoney(comparison.delta?.cost || 0)} (${signedPct(comparison.delta?.costPct ?? null)}) vs previous ${comparison.windowDays}d`;
  }

  function formatRequestComparison(comparison) {
    if (!comparison || !comparison.windowDays) return "";
    return `${signedNumber(comparison.delta?.reqs || 0)} reqs vs previous ${comparison.windowDays}d`;
  }

  function renderLeaks(d) {
    const el = document.getElementById("leak-banner");
    const wp = d.leaks.totals.work_pays_personal;
    const pw = d.leaks.totals.personal_pays_work;
    if (d.leaks.count === 0 || wp + pw < 0.01) {
      el.hidden = true;
      return;
    }
    el.hidden = false;
    const top = d.leaks.sessions[0];
    el.innerHTML =
      `<div class="lb-icon">⚠️</div>` +
      `<div class="lb-main"><h3>Cross-account leak detected</h3>` +
      `<p>${d.leaks.count} session(s) billed to the wrong account in this window.` +
      (top
        ? ` Largest: <b>${money(top.cost)}</b> on <b>${esc(top.account)}</b> running <b>${esc(top.project)}</b> (${top.durationMin}m).`
        : "") +
      `</p></div>` +
      `<div class="leak-figs">` +
      `<div class="leak-fig"><div class="n">${money(wp)}</div><div class="l">work → personal work</div></div>` +
      `<div class="leak-fig"><div class="n">${money(pw)}</div><div class="l">personal → work work</div></div>` +
      `</div>`;
  }

  function renderAccounts(d) {
    const p = d.accounts.personal.cost;
    const w = d.accounts.work.cost;
    const total = p + w || 1;
    const el = document.getElementById("account-split");
    const rows = [
      ["personal", "Personal", p, d.accounts.personal, "#5b9dff"],
      ["work", "Work", w, d.accounts.work, "#e3b259"],
    ];
    el.innerHTML =
      `<div class="split-bar">` +
      `<span style="width:${(p / total) * 100}%;background:#5b9dff"></span>` +
      `<span style="width:${(w / total) * 100}%;background:#e3b259"></span>` +
      `</div>` +
      rows
        .map(
          ([, name, cost, b, col]) =>
            `<div class="acct-row"><div class="a-name"><span class="sw" style="background:${col}"></span>${esc(name)}` +
            ` <span style="color:var(--faint);font-weight:400">${pct(cost / total)}</span></div>` +
            `<div class="a-val"><div class="a-cost">${money(cost)}</div>` +
            `<div class="a-tok">${tok(b.output)} out · ${tok(b.reqs)} reqs</div></div></div>`,
        )
        .join("");
  }

  function renderModels(d) {
    const models = d.models.filter((m) => m.cost > 0).slice(0, 6);
    const segs = models.map((m) => ({ value: m.cost, color: modelColor(m.model) }));
    MizanCharts.drawDonut(document.getElementById("model-donut"), segs);
    const total = models.reduce((s, m) => s + m.cost, 0) || 1;
    document.getElementById("model-legend").innerHTML = models
      .map(
        (m) =>
          `<div class="row"><span class="nm"><span class="sw" style="background:${modelColor(m.model)}"></span>${esc(modelShort(m.model))}</span>` +
          `<span class="v">${money(m.cost)} · ${pct(m.cost / total)}</span></div>`,
      )
      .join("");
  }

  function renderCache(d) {
    const r = d.cache.hitRatio;
    document.getElementById("cache-gauge").innerHTML =
      `<div class="gauge"><div class="big">${pct(r)}</div>` +
      `<div class="meta">of input tokens served from cache<br>` +
      `<b>${tok(d.cache.readTokens)}</b> cache reads (0.1× price)<br>` +
      `<b>${tok(d.cache.freshInputTokens)}</b> fresh input (full price)</div></div>`;
  }

  function renderProjects(d) {
    const top = d.projects.filter((p) => p.cost > 0).slice(0, 10);
    const max = top.length ? top[0].cost : 1;
    document.getElementById("projects").innerHTML = top
      .map((p) => {
        const col = p.account === "work" ? "#e3b259" : "#5b9dff";
        return (
          `<div class="bar-row"><div class="bar-label"><span class="tag ${esc(p.account)}">${esc(p.account[0].toUpperCase())}</span>${esc(p.display)}</div>` +
          `<div class="bar-cost">${money(p.cost)}</div>` +
          `<div class="bar-track"><div class="bar-fill" style="width:${(p.cost / max) * 100}%;background:${col}"></div></div></div>`
        );
      })
      .join("");
  }

  function renderProjectChanges(d) {
    const panel = document.getElementById("panel-project-changes");
    const el = document.getElementById("project-changes");
    const comparison = d.comparison;
    if (!comparison || !comparison.windowDays) {
      panel.hidden = true;
      el.innerHTML = "";
      return;
    }

    panel.hidden = false;
    const movers = comparison.projects || [];
    if (!movers.length) {
      el.innerHTML = `<div class="empty-note">Project spend is flat versus the previous window.</div>`;
      return;
    }

    const max = movers.reduce((largest, item) => Math.max(largest, Math.abs(item.delta?.cost || 0)), 1);
    el.innerHTML = movers
      .slice(0, 5)
      .map((project) => {
        const account = project.account || "unknown";
        const delta = project.delta || {};
        const current = project.current || {};
        const previous = project.previous || {};
        const col = account === "work" ? "#e3b259" : "#5b9dff";
        return (
          `<div class="mover-row">` +
          `<div class="mover-main"><span class="tag ${esc(account)}">${esc(account.slice(0, 1).toUpperCase())}</span>` +
          `<span class="mover-project" title="${esc(project.project)}">${esc(project.project)}</span></div>` +
          `<div class="mover-change">${signedMoney(delta.cost || 0)} <span>${signedPct(delta.costPct ?? null)}</span></div>` +
          `<div class="mover-meta">${money(current.cost || 0)} now · ${money(previous.cost || 0)} before · ${signedNumber(delta.reqs || 0)} reqs</div>` +
          `<div class="mover-track"><div style="width:${(Math.abs(delta.cost || 0) / max) * 100}%;background:${col}"></div></div>` +
          `</div>`
        );
      })
      .join("");
  }

  function renderSessions(d) {
    const rows = d.sessions
      .map((s) => {
        const badges =
          (s.leak ? `<span class="badge leak">leak</span> ` : "") +
          (s.agent ? `<span class="badge agent">agent</span>` : "");
        return (
          `<tr><td class="num">${money(s.cost)}</td>` +
          `<td><span class="tag ${esc(s.account)}" style="font-size:10px;padding:1px 6px;border-radius:5px">${esc(s.account)}</span></td>` +
          `<td class="proj-cell" title="${esc(s.cwd || "")}">${esc(s.project)}</td>` +
          `<td>${esc(modelShort(s.model))}</td>` +
          `<td class="num">${tok(s.output)}</td>` +
          `<td class="num">${s.durationMin}m</td>` +
          `<td>${badges || "—"}</td></tr>`
        );
      })
      .join("");
    document.getElementById("sessions").innerHTML =
      `<table><thead><tr><th class="num">Cost</th><th>Acct</th><th>Project</th><th>Model</th><th class="num">Out</th><th class="num">Dur</th><th>Flags</th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  function renderFooter(d) {
    const s = d.stats || {};
    document.getElementById("foot-stats").textContent =
      `${s.records?.toLocaleString?.() || s.records} usage records · ` +
      `${s.files?.toLocaleString?.() || s.files} transcripts (${s.parsed} parsed, ${s.cached} cached) · ` +
      `computed in ${s.computeMs}ms`;
    const pricing = d.pricing || {};
    document.getElementById("pricing-note").innerHTML =
      `Estimated from local transcripts using ` +
      (pricing.sourceUrl
        ? `<a href="${esc(pricing.sourceUrl)}" target="_blank" rel="noreferrer">${esc(pricing.sourceName || "public pricing")}</a>`
        : esc(pricing.sourceName || "public pricing")) +
      (pricing.checkedAt ? ` checked ${esc(pricing.checkedAt)}` : "") +
      ` · authoritative billing: console.anthropic.com`;
  }

  // ---- events ----
  document.getElementById("window-tabs").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-window]");
    if (!btn) return;
    document.querySelectorAll("#window-tabs button").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    state.window = btn.dataset.window;
    load();
  });
  document.getElementById("refresh").addEventListener("click", load);
  document.getElementById("copy-report").addEventListener("click", copyReport);
  document.getElementById("download-report").addEventListener("click", downloadReport);
  document.getElementById("download-csv").addEventListener("click", downloadCsv);
  document.getElementById("actions").addEventListener("click", copyActionCommand);
  window.addEventListener("resize", () => {
    if (window._mz) {
      MizanCharts.drawDaily(document.getElementById("daily-chart"), window._mz.days);
      renderModels(window._mz);
    }
  });

  load();
  state.timer = setInterval(load, 15000);

  async function copyReport() {
    const btn = document.getElementById("copy-report");
    btn.disabled = true;
    setCopyState("Copying...");
    try {
      const res = await fetch(`/api/report?window=${state.window}`);
      const markdown = await res.text();
      if (!res.ok) throw new Error(markdown || res.statusText);
      await writeClipboard(markdown);
      setCopyState("Copied");
    } catch (err) {
      console.error(err);
      setCopyState("Copy failed");
    } finally {
      btn.disabled = false;
    }
  }

  async function downloadReport() {
    const btn = document.getElementById("download-report");
    btn.disabled = true;
    setDownloadState("Saving...");
    let url = null;
    try {
      const res = await fetch(`/api/report?window=${state.window}`);
      const markdown = await res.text();
      if (!res.ok) throw new Error(markdown || res.statusText);
      const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
      url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = reportFilename("md");
      document.body.appendChild(link);
      link.click();
      link.remove();
      setDownloadState("Saved");
    } catch (err) {
      console.error(err);
      setDownloadState("Save failed");
    } finally {
      if (url) window.setTimeout(() => URL.revokeObjectURL(url), 0);
      btn.disabled = false;
    }
  }

  async function downloadCsv() {
    const btn = document.getElementById("download-csv");
    btn.disabled = true;
    setCsvState("Saving CSV...");
    let url = null;
    try {
      const res = await fetch(`/api/report?window=${state.window}&format=csv`);
      const csv = await res.text();
      if (!res.ok) throw new Error(csv || res.statusText);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = reportFilename("csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      setCsvState("Saved CSV");
    } catch (err) {
      console.error(err);
      setCsvState("CSV failed");
    } finally {
      if (url) window.setTimeout(() => URL.revokeObjectURL(url), 0);
      btn.disabled = false;
    }
  }

  async function copyActionCommand(event) {
    const btn = event.target.closest("[data-copy-command]");
    if (!btn) return;
    const original = btn.textContent;
    btn.disabled = true;
    try {
      await writeClipboard(btn.dataset.copyCommand);
      btn.textContent = "Copied";
      window.setTimeout(() => {
        btn.textContent = original;
      }, 1600);
    } catch (err) {
      console.error(err);
      btn.textContent = "Failed";
      window.setTimeout(() => {
        btn.textContent = original;
      }, 1600);
    } finally {
      btn.disabled = false;
    }
  }

  async function writeClipboard(text) {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try {
      if (!document.execCommand("copy")) throw new Error("Clipboard copy was blocked");
    } finally {
      ta.remove();
    }
  }

  function reportFilename(ext = "md") {
    const day = new Date().toISOString().slice(0, 10);
    return `mizan-report-${state.window}-${day}.${ext}`;
  }
})();
