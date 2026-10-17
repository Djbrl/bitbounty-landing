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

  // Git-graph story: the green line comes out from under the hero phone, branches out
  // to each feature, and turns purple at the merge that pays the developer.
  var graph = document.getElementById("graph");
  var svg = document.getElementById("graphSvg");
  var heroPhone = document.querySelector(".phone.big");
  var rows = Array.prototype.slice.call(graph.querySelectorAll(".g-row"));
  var NS = "http://www.w3.org/2000/svg";
  var GREEN = "#1F9D55", PURPLE = "#8250DF", LANE = 58;
  var clipRect, ticking = false;

  function el(name, attrs) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  function layout() {
    var narrow = window.innerWidth <= 760;
    var g = graph.getBoundingClientRect();
    var p = heroPhone.getBoundingClientRect();
    var startX = p.left + p.width / 2 - g.left;
    var spineX = narrow ? 34 : g.width / 2;
    var W = g.width, H = graph.offsetHeight;
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    svg.replaceChildren();

    var defs = el("defs", {});
    var clip = el("clipPath", { id: "reveal" });
    clipRect = el("rect", { x: -50, y: 0, width: W + 100, height: 0 });
    clip.appendChild(clipRect); defs.appendChild(clip); svg.appendChild(defs);
    var layer = el("g", { "clip-path": "url(#reveal)" });
    svg.appendChild(layer);

    var feature = 0, mergeY = H - 200, endY = H - 200;
    rows.forEach(function (row) {
      var kind = row.getAttribute("data-kind");
      if (kind === "end") return;
      var right = narrow ? true : (feature % 2 === 0);
      row.classList.toggle("right", right && !narrow);
      row.classList.toggle("left", !right && !narrow);
      feature++;
    });

    // positions after classes applied
    var pieces = [];
    rows.forEach(function (row) {
      var kind = row.getAttribute("data-kind");
      var top = row.offsetTop, h = row.offsetHeight;
      if (kind === "end") { endY = top + 30; return; }
      var right = narrow || row.classList.contains("right");
      var lane = narrow ? 28 : LANE;
      var laneX = spineX + (right ? lane : -lane);
      var forkY = top - 46, inY = top + 8, outY = top + h + 10, joinY = top + h + 64;
      var color = kind === "merge" ? PURPLE : GREEN;
      var d = "M" + spineX + "," + forkY + " C" + spineX + "," + (forkY + 30) + " " + laneX + "," + (inY - 30) + " " + laneX + "," + inY +
              " L" + laneX + "," + outY + " C" + laneX + "," + (outY + 30) + " " + spineX + "," + (joinY - 30) + " " + spineX + "," + joinY;
      pieces.push(el("path", { d: d, fill: "none", stroke: color, "stroke-width": 4, "stroke-linecap": "round" }));
      var dotY = top + Math.min(36, h / 2);
      pieces.push(el("circle", { cx: laneX, cy: dotY, r: 9, fill: "#FFFFFF", stroke: color, "stroke-width": 4 }));
      if (kind === "merge") mergeY = joinY;
    });

    var mainD = "M" + startX + ",0 C" + startX + ",60 " + spineX + ",50 " + spineX + ",110 L" + spineX + "," + mergeY;
    layer.appendChild(el("path", { d: mainD, fill: "none", stroke: GREEN, "stroke-width": 4, "stroke-linecap": "round" }));
    layer.appendChild(el("path", { d: "M" + spineX + "," + mergeY + " L" + spineX + "," + endY, fill: "none", stroke: PURPLE, "stroke-width": 6, "stroke-linecap": "round" }));
    pieces.forEach(function (n) { layer.appendChild(n); });
    layer.appendChild(el("circle", { cx: spineX, cy: mergeY, r: 11, fill: PURPLE }));
    layer.appendChild(el("circle", { cx: spineX, cy: endY, r: 14, fill: PURPLE }));
    update();
  }

  function update() {
    ticking = false;
    var vh = window.innerHeight || 800;
    var g = graph.getBoundingClientRect();
    var revealY = Math.max(0, vh * 0.62 - g.top);
    if (clipRect) clipRect.setAttribute("height", revealY);
    rows.forEach(function (row) { row.classList.toggle("on", revealY > row.offsetTop + 10); });
  }

  function request() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener("scroll", request, { passive: true });
  var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(layout, 120); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  window.addEventListener("load", layout);
  layout();
})();
