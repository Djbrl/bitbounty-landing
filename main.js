(function () {
  var cfg = window.BITBOUNTY || {};

  // Links that depend on config
  if (cfg.demoUrl) {
    document.querySelectorAll(".js-demo").forEach(function (a) { a.href = cfg.demoUrl; a.target = "_blank"; a.rel = "noopener"; });
    document.querySelectorAll(".js-demo-only").forEach(function (a) { a.href = cfg.demoUrl; a.hidden = false; a.target = "_blank"; a.rel = "noopener"; });
  }
  if (cfg.githubAppUrl) {
    document.querySelectorAll(".js-install").forEach(function (a) { a.href = cfg.githubAppUrl; a.target = "_blank"; a.rel = "noopener"; });
  }
  if (cfg.repoUrl) {
    document.querySelectorAll(".js-repo").forEach(function (a) { a.href = cfg.repoUrl; });
  }
  if (cfg.trailerYoutubeId && /^[A-Za-z0-9_-]{6,20}$/.test(cfg.trailerYoutubeId)) {
    var v = document.getElementById("video");
    var f = document.createElement("iframe");
    f.src = "https://www.youtube-nocookie.com/embed/" + cfg.trailerYoutubeId + "?rel=0";
    f.title = "BitBounty trailer";
    f.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    f.allowFullscreen = true;
    v.replaceChildren(f);
  }

  // Git-graph story, camera-follow version. The canvas is centred on the page; the line
  // starts under the hero phone. The camera pans so the active track stays in view, and
  // branches swing far enough that main leaves the frame until they come back.
  var graph = document.getElementById("graph");
  var canvas = document.getElementById("graphCanvas");
  var svg = document.getElementById("graphSvg");
  var stops = {};
  Array.prototype.forEach.call(canvas.querySelectorAll(".g-stop"), function (n) { stops[n.getAttribute("data-stop")] = n; });
  var NS = "http://www.w3.org/2000/svg";
  var GREEN = "#1F9D55", PURPLE = "#8250DF", W = 12;
  var T = 360;                                    // vertical length of a branch curve
  var R = { fork: 560, out: 1480 };               // bounty/fund branch (right)
  var L = { fork: 2280, out: 3880 };              // awa-sow/fix-retry branch (left, purple)
  var MERGE = 4240, END = 5050, HEIGHT = 5650;
  var PLAN = [                                    // uneven stops on purpose
    { id: "post", lane: 0, y: 300, side: "r" },
    { id: "fund", lane: 1, y: 1180, side: "l" },
    { id: "claim", lane: 0, y: 2060, side: "r" },
    { id: "push", lane: -1, y: 2900, side: "r" },
    { id: "review", lane: -1, y: 3600, side: "l" },
    { id: "merge", lane: 0, y: MERGE + 180, side: "l" },
    { id: "paid", lane: 0, y: END + 90, side: "c" }
  ];
  var B = 600, narrow = false, clipRect = null, cam = 0, camTarget = 0, animating = false;

  function el(name, attrs) { var n = document.createElementNS(NS, name); for (var k in attrs) n.setAttribute(k, attrs[k]); return n; }
  function clamp(x) { return Math.min(1, Math.max(0, x)); }
  function smooth(x) { x = clamp(x); return x * x * (3 - 2 * x); }

  function trackX(y) {
    if (y >= R.fork && y < R.fork + T) return B * smooth((y - R.fork) / T);
    if (y >= R.fork + T && y < R.out) return B;
    if (y >= R.out && y < R.out + T) return B * (1 - smooth((y - R.out) / T));
    if (y >= L.fork && y < L.fork + T) return -B * smooth((y - L.fork) / T);
    if (y >= L.fork + T && y < L.out) return -B;
    if (y >= L.out && y < L.out + T) return -B * (1 - smooth((y - L.out) / T));
    return 0;
  }
  function screenOffset(y, vw) { return narrow ? -(vw / 2 - 44) * smooth(y / 520) : 0; }

  function branch(x, b) {
    return "M0," + b.fork + " C0," + (b.fork + T / 2) + " " + x + "," + (b.fork + T / 2) + " " + x + "," + (b.fork + T) +
           " L" + x + "," + b.out + " C" + x + "," + (b.out + T / 2) + " 0," + (b.out + T / 2) + " 0," + (b.out + T);
  }

  function layout() {
    var vw = window.innerWidth;
    narrow = vw <= 760;
    B = narrow ? Math.round(vw * 0.85) : Math.max(560, Math.round(vw * 0.64));
    graph.style.height = HEIGHT + "px";
    svg.replaceChildren();
    var defs = el("defs", {}), clip = el("clipPath", { id: "reveal" });
    clipRect = el("rect", { x: -3 * B, y: -20, width: 6 * B, height: 0 });
    clip.appendChild(clipRect); defs.appendChild(clip); svg.appendChild(defs);
    var g = el("g", { "clip-path": "url(#reveal)", fill: "none", "stroke-linecap": "round" });
    svg.appendChild(g);
    g.appendChild(el("path", { d: "M0,0 L0," + MERGE, stroke: GREEN, "stroke-width": W }));
    g.appendChild(el("path", { d: branch(B, R), stroke: GREEN, "stroke-width": W }));
    g.appendChild(el("path", { d: branch(-B, L), stroke: PURPLE, "stroke-width": W }));
    g.appendChild(el("path", { d: "M0," + MERGE + " L0," + END, stroke: PURPLE, "stroke-width": W + 4 }));
    PLAN.forEach(function (p) {
      if (p.id === "paid" || p.id === "merge") return;
      var x = p.lane * B, c = p.lane === -1 ? PURPLE : GREEN;
      g.appendChild(el("circle", { cx: x, cy: p.y, r: 20, fill: "#FFFFFF", stroke: c, "stroke-width": W }));
    });
    g.appendChild(el("circle", { cx: 0, cy: MERGE, r: 26, fill: PURPLE, stroke: "none" }));
    g.appendChild(el("circle", { cx: 0, cy: END, r: 32, fill: PURPLE, stroke: "none" }));

    PLAN.forEach(function (p) {
      var n = stops[p.id]; if (!n) return;
      var x = p.lane * B;
      var side = narrow && p.side !== "c" ? "r" : p.side;
      n.classList.toggle("l", side === "l");
      n.classList.toggle("r", side === "r");
      n.style.top = p.y + "px";
      if (side === "r") n.style.left = (x + (narrow ? 40 : 80)) + "px";
      else if (side === "l") n.style.left = (x - 80 - n.offsetWidth) + "px";
      else n.style.left = (narrow ? (vwOffsetForFinal(vw)) : 0) + "px";
    });
    update(true);
  }
  function vwOffsetForFinal(vw) { return vw / 2 - 44 - 0; }

  function update(jump) {
    var vw = window.innerWidth, vh = window.innerHeight || 800;
    var r = graph.getBoundingClientRect();
    var playY = vh * 0.5 - r.top;
    if (clipRect) clipRect.setAttribute("height", Math.max(0, playY + 80));
    PLAN.forEach(function (p) { var n = stops[p.id]; if (n) n.classList.toggle("on", playY > p.y - vh * 0.18); });
    var y = Math.min(Math.max(playY, 0), END);
    camTarget = -trackX(y) + screenOffset(y, vw);
    if (jump === true) { cam = camTarget; apply(); return; }
    if (!animating) { animating = true; requestAnimationFrame(step); }
  }
  function apply() { canvas.style.transform = "translateX(" + cam.toFixed(1) + "px)"; }
  function step() {
    var d = camTarget - cam;
    cam += d * 0.14;
    if (Math.abs(d) < 0.5) { cam = camTarget; animating = false; apply(); return; }
    apply();
    requestAnimationFrame(step);
  }

  window.addEventListener("scroll", function () { update(false); }, { passive: true });
  var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(layout, 120); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  layout();
})();
