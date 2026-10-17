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

  // Scrollytelling: one phone flies from the hero to the story and plays the scenes on its screen
  var phone = document.getElementById("phone");
  var heroSlot = document.getElementById("heroSlot");
  var stageSlot = document.getElementById("stageSlot");
  var stageWrap = stageSlot.parentElement;
  var story = document.getElementById("story");
  var rail = document.getElementById("phRail");
  var fill = document.getElementById("railFill");
  var steps = Array.prototype.slice.call(document.querySelectorAll(".cap"));
  var stepsBox = document.getElementById("steps");
  var layers = Array.prototype.slice.call(phone.querySelectorAll(".ph-layer"));
  var heroSide = Array.prototype.slice.call(document.querySelectorAll(".hero-visual .amount, .hero-visual .card.merged"));
  var storyTitle = document.querySelector(".story-title");
  var BASE_W = 360;
  var mode = null, stepNow = -1, ticking = false;

  function clamp(x) { return Math.min(1, Math.max(0, x)); }
  function ease(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function setMode(next, step) {
    if (next === mode && step === stepNow) return;
    var order = ["lock", "0", "1", "2", "3"];
    mode = next; stepNow = step;
    layers.forEach(function (l) {
      var key = l.getAttribute("data-layer");
      l.classList.toggle("on", key === next);
      l.classList.toggle("past", order.indexOf(key) < order.indexOf(next));
    });
    steps.forEach(function (s, i) { s.classList.toggle("on", i === step); });
  }

  function frame() {
    ticking = false;
    var vh = window.innerHeight || 800;
    var h = heroSlot.getBoundingClientRect();
    var st = stageSlot.getBoundingClientRect();
    var stickyTop = parseFloat(getComputedStyle(stageWrap).top) || 80;
    var t = clamp((vh - st.top) / Math.max(1, vh - stickyTop));
    var e = ease(t);
    var left = lerp(h.left, st.left, e), top = lerp(h.top, st.top, e), w = lerp(h.width, st.width, e);
    phone.style.transform = "translate(" + left + "px," + top + "px) scale(" + (w / BASE_W) + ")";
    phone.classList.add("ready");
    var fade = String(clamp(1 - t * 3));
    heroSide.forEach(function (el) { el.style.opacity = fade; });
    storyTitle.style.opacity = String(clamp(1 - (t - 0.15) * 2.5));

    var sb = stepsBox.getBoundingClientRect();
    var p = clamp((st.bottom - sb.top) / Math.max(1, sb.height - vh * 0.35));
    var step = Math.min(4, Math.floor(p * 5));
    var inStory = t > 0.98;
    rail.classList.toggle("on", inStory);
    fill.style.width = Math.round(p * 100) + "%";
    fill.classList.toggle("done", step >= 4);
    if (!inStory) setMode("lock", -1);
    else setMode(step >= 4 ? "lock" : String(step), step);
  }

  function request() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(request);
  frame();
})();
