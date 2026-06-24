// Lightweight canvas charts — no dependencies, retina-aware.
(function () {
  const COL = {
    personal: "#5b9dff",
    work: "#e3b259",
    grid: "#222b38",
    axis: "#5c6577",
  };

  function setup(canvas, cssHeight) {
    const dpr = window.devicePixelRatio || 1;
    // Guard against a not-yet-laid-out canvas (clientWidth 0) producing bad geometry.
    const w = Math.max(
      canvas.clientWidth || canvas.parentElement.clientWidth || canvas.width || 0,
      40,
    );
    const h = cssHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.height = h + "px";
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h };
  }

  const money = (n) =>
    "$" + (n >= 1000 ? (n / 1000).toFixed(1) + "k" : n.toFixed(n < 10 ? 2 : 0));

  // Stacked area: personal (bottom) + work (top).
  function drawDaily(canvas, days) {
    const { ctx, w, h } = setup(canvas, 240);
    ctx.clearRect(0, 0, w, h);
    if (!days.length) return;

    const padL = 46,
      padR = 12,
      padT = 14,
      padB = 26;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;
    const maxTotal = Math.max(...days.map((d) => d.total), 0.01);
    const niceMax = niceCeil(maxTotal);

    const x = (i) => padL + (days.length === 1 ? plotW / 2 : (i / (days.length - 1)) * plotW);
    const y = (v) => padT + plotH - (v / niceMax) * plotH;

    // gridlines + y labels
    ctx.font = "11px -apple-system, sans-serif";
    ctx.textBaseline = "middle";
    for (let g = 0; g <= 4; g++) {
      const val = (niceMax / 4) * g;
      const yy = y(val);
      ctx.strokeStyle = COL.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padL, yy);
      ctx.lineTo(w - padR, yy);
      ctx.stroke();
      ctx.fillStyle = COL.axis;
      ctx.textAlign = "right";
      ctx.fillText(money(val), padL - 8, yy);
    }

    // stacked areas: bottom = personal, then work stacked on top
    area(ctx, days, x, y, (d) => 0, (d) => d.personal, COL.personal);
    area(ctx, days, x, y, (d) => d.personal, (d) => d.personal + d.work, COL.work);

    // top line of the total
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    days.forEach((d, i) => {
      const px = x(i),
        py = y(d.total);
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    });
    ctx.stroke();

    // x labels (first, middle, last)
    ctx.fillStyle = COL.axis;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const idxs = days.length > 2 ? [0, Math.floor(days.length / 2), days.length - 1] : days.map((_, i) => i);
    for (const i of idxs) ctx.fillText(fmtDate(days[i].date), x(i), h - padB + 8);

    // hover interaction
    canvas._geo = { x, y, days, padL, padR, padT, plotH, niceMax, w, h };
    attachHover(canvas);
  }

  function area(ctx, days, x, y, lo, hi, color) {
    ctx.beginPath();
    days.forEach((d, i) => {
      const px = x(i),
        py = y(hi(d));
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    });
    for (let i = days.length - 1; i >= 0; i--) ctx.lineTo(x(i), y(lo(days[i])));
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, y(0));
    grad.addColorStop(0, hexA(color, 0.42));
    grad.addColorStop(1, hexA(color, 0.06));
    ctx.fillStyle = grad;
    ctx.fill();
  }

  function attachHover(canvas) {
    if (canvas._hoverBound) return;
    canvas._hoverBound = true;
    const tip = document.createElement("div");
    tip.className = "chart-tip";
    tip.style.cssText =
      "position:fixed;pointer-events:none;background:#0c0f14;border:1px solid #2c3442;border-radius:8px;padding:8px 11px;font-size:12px;color:#e8ecf3;box-shadow:0 6px 20px rgba(0,0,0,.5);display:none;z-index:50;white-space:nowrap";
    document.body.appendChild(tip);
    canvas.addEventListener("mousemove", (e) => {
      const g = canvas._geo;
      if (!g) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const n = g.days.length;
      const frac = (mx - g.padL) / (g.w - g.padL - g.padR);
      let i = Math.round(frac * (n - 1));
      i = Math.max(0, Math.min(n - 1, i));
      const d = g.days[i];
      tip.style.display = "block";
      tip.style.left = e.clientX + 14 + "px";
      tip.style.top = e.clientY - 10 + "px";
      tip.innerHTML =
        `<b>${d.date}</b><br>` +
        `<span style="color:#5b9dff">●</span> Personal $${d.personal.toFixed(2)}<br>` +
        `<span style="color:#e3b259">●</span> Work $${d.work.toFixed(2)}<br>` +
        `<b>Total $${d.total.toFixed(2)}</b>`;
    });
    canvas.addEventListener("mouseleave", () => (tip.style.display = "none"));
  }

  function drawDonut(canvas, segments) {
    const { ctx, w, h } = setup(canvas, 150);
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2,
      cy = h / 2,
      r = Math.min(w, h) / 2 - 6,
      inner = r * 0.62;
    if (r <= 0 || !segments.length) return;
    const total = segments.reduce((s, x) => s + x.value, 0) || 1;
    let a0 = -Math.PI / 2;
    for (const s of segments) {
      const a1 = a0 + (s.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, a0, a1);
      ctx.closePath();
      ctx.fillStyle = s.color;
      ctx.fill();
      a0 = a1;
    }
    // punch the hole
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(cx, cy, inner, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  }

  // helpers
  function niceCeil(v) {
    if (v <= 0) return 1;
    const mag = Math.pow(10, Math.floor(Math.log10(v)));
    const n = v / mag;
    const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
    return step * mag;
  }
  function fmtDate(s) {
    const [, m, d] = s.split("-");
    return `${+m}/${+d}`;
  }
  function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }

  window.MizanCharts = { drawDaily, drawDonut };
})();
