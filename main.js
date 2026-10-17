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

  // Git-graph story. The line starts under the maintainer's laptop, the camera follows the
  // active track, branches swing out with long smooth curves, and the line ends in a phone
  // that lights up with the payout.
  var graph = document.getElementById("graph");
  var canvas = document.getElementById("graphCanvas");
  var svg = document.getElementById("graphSvg");
  var endBox = document.getElementById("gEnd");
  var endPhone = document.getElementById("endPhone");
  var stops = {};
  Array.prototype.forEach.call(canvas.querySelectorAll(".g-stop"), function (n) { stops[n.getAttribute("data-stop")] = n; });
  var NS = "http://www.w3.org/2000/svg";
  var GREEN = "#1F9D55", PURPLE = "#8250DF", W = 12, T = 720;
  var R = { fork: 860, out: 2320 };     // bounty/fund (right)
  var L = { fork: 3820, out: 5960 };    // awa-sow/fix-retry (left, purple)
  var MERGE = L.out + T, END = 7520, HEIGHT = 8320;
  var PLAN = [
    { id: "post", lane: 0, y: 460 },
    { id: "fund", lane: 1, y: 1950, flip: true },
    { id: "claim", lane: 0, y: 3400 },
    { id: "push", lane: -1, y: 4900, flip: true },
    { id: "review", lane: -1, y: 5600 },
    { id: "merge", lane: 0, y: MERGE + 330, flip: true }
  ];
  var B = 600, narrow = false, clipRect = null, cam = 0, camTarget = 0, animating = false;

  function el(name, attrs) { var n = document.createElementNS(NS, name); for (var k in attrs) n.setAttribute(k, attrs[k]); return n; }
  function clamp(x) { return Math.min(1, Math.max(0, x)); }
  function smooth(x) { x = clamp(x); return x * x * x * (x * (x * 6 - 15) + 10); }

  function trackX(y) {
    if (y >= R.fork && y < R.fork + T) return B * smooth((y - R.fork) / T);
    if (y >= R.fork + T && y < R.out) return B;
    if (y >= R.out && y < R.out + T) return B * (1 - smooth((y - R.out) / T));
    if (y >= L.fork && y < L.fork + T) return -B * smooth((y - L.fork) / T);
    if (y >= L.fork + T && y < L.out) return -B;
    if (y >= L.out && y < L.out + T) return -B * (1 - smooth((y - L.out) / T));
    return 0;
  }
  function screenOffset(y, vw) {
    if (!narrow) return 0;
    return -(vw / 2 - 40) * smooth(y / 520) * (1 - smooth((y - (END - 900)) / 600));
  }
  function branch(x, b) {
    return "M0," + b.fork + " C0," + (b.fork + T * 0.55) + " " + x + "," + (b.fork + T * 0.45) + " " + x + "," + (b.fork + T) +
           " L" + x + "," + b.out + " C" + x + "," + (b.out + T * 0.55) + " 0," + (b.out + T * 0.45) + " 0," + (b.out + T);
  }

  function drawMap() {
    var mask = [
      "......########..........", "....############........", "...##############.......", "..################......",
      ".##################.....", "####################....", "#####################...", "######################..",
      ".#####################..", "..####################..", "....##################..", "......###############...",
      ".......##############...", ".......#############....", ".......############.....", "........###########.....",
      "........##########...##.", ".........#########..##..", ".........########...##..", "..........#######.......",
      "..........######........", "...........####.........", "............##.........."
    ];
    var m = document.getElementById("mapDots"); if (!m) return;
    m.replaceChildren();
    mask.forEach(function (row, r) {
      for (var c = 0; c < row.length; c++) if (row[c] === "#") m.appendChild(el("circle", { cx: 6 + c * 10, cy: 6 + r * 10, r: 3.3, fill: "#CFD8D2" }));
    });
    // Tech hubs (approximate positions on the dot grid). Dakar is the story's pin.
    var hubs = [["Abidjan", 5, 9], ["Accra", 8, 9], ["Lagos", 10, 9], ["Nairobi", 18, 11], ["Kigali", 15, 12], ["Le Caire", 17, 1], ["Johannesburg", 13, 19]];
    hubs.forEach(function (h, i) {
      var x = 6 + h[1] * 10, y = 6 + h[2] * 10;
      var c = el("circle", { cx: x, cy: y, r: 4.6, fill: "#3CC77E", class: "map-hub" });
      c.style.animationDelay = (i * 0.25) + "s";
      m.appendChild(c);
    });
    var px = 6, py = 56;
    m.appendChild(el("circle", { cx: px, cy: py, r: 16, fill: "#1F9D55", opacity: "0.18", class: "map-pulse" }));
    m.appendChild(el("circle", { cx: px, cy: py, r: 7, fill: "#1F9D55" }));
    var t = el("text", { x: px + 14, y: py - 10, fill: "#0B1F17", "font-size": "13", "font-weight": "700", "font-family": "Instrument Sans, sans-serif" });
    t.textContent = "Dakar"; m.appendChild(t);
  }

  function layout() {
    var vw = window.innerWidth;
    narrow = vw <= 760;
    B = narrow ? Math.round(vw * 0.85) : Math.max(520, Math.round(vw * 0.57));
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
    g.appendChild(el("path", { d: "M0," + MERGE + " L0," + (END + 12), stroke: PURPLE, "stroke-width": W + 4 }));
    PLAN.forEach(function (p) {
      if (p.id === "merge") return;
      var c = p.lane === -1 ? PURPLE : GREEN;
      g.appendChild(el("circle", { cx: p.lane * B, cy: p.y, r: 22, fill: "#FFFFFF", stroke: c, "stroke-width": W }));
    });
    g.appendChild(el("circle", { cx: 0, cy: MERGE, r: 28, fill: PURPLE, stroke: "none" }));

    PLAN.forEach(function (p) {
      var n = stops[p.id]; if (!n) return;
      n.classList.toggle("flip", !!p.flip && !narrow);
      n.style.top = p.y + "px";
      n.style.left = (p.lane * B + (narrow ? 34 : 0)) + "px";
    });
    endBox.style.top = END + "px";
    endBox.style.left = "0px";
    drawMap();
    update(true);
  }

  function update(jump) {
    var vw = window.innerWidth, vh = window.innerHeight || 800;
    var r = graph.getBoundingClientRect();
    // The line starts growing with the very first pixel of scroll, ahead of the viewport,
    // then the viewport catches up and the tip settles at mid-screen.
    var mid = vh * 0.5 - r.top;
    var gap = Math.max(1, -(vh * 0.5 - (r.top + window.scrollY)));
    var lead = gap * (1 - smooth(window.scrollY / (3 * gap)));   // slope > -1, so the tip only moves forward
    var playY = Math.max(0, mid + lead);
    if (clipRect) clipRect.setAttribute("height", Math.max(0, playY + 90));
    PLAN.forEach(function (p) { var n = stops[p.id]; if (n) n.classList.toggle("on", playY > p.y - vh * 0.22); });
    endPhone.classList.toggle("lit", playY > END + 140);
    var y = Math.min(Math.max(playY, 0), END);
    camTarget = -trackX(y) + screenOffset(y, vw);
    if (jump === true) { cam = camTarget; apply(); return; }
    if (!animating) { animating = true; requestAnimationFrame(step); }
  }
  function apply() { canvas.style.transform = "translateX(" + cam.toFixed(1) + "px)"; }
  function step() {
    var d = camTarget - cam;
    cam += d * 0.075;
    if (Math.abs(d) < 0.4) { cam = camTarget; animating = false; apply(); return; }
    apply();
    requestAnimationFrame(step);
  }

  window.addEventListener("scroll", function () { update(false); }, { passive: true });
  var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(layout, 120); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  layout();
})();
