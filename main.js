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

  // Scrollytelling
  var story = document.getElementById("story");
  var steps = Array.prototype.slice.call(document.querySelectorAll(".step"));
  var scenes = Array.prototype.slice.call(document.querySelectorAll(".scene"));
  var fill = document.getElementById("railFill");
  var current = -1;

  function render(step, progress) {
    fill.style.width = Math.round(progress * 100) + "%";
    fill.classList.toggle("done", step >= 4);
    if (step === current) return;
    current = step;
    steps.forEach(function (s, i) { s.classList.toggle("on", i === step); });
    scenes.forEach(function (s, i) {
      s.classList.toggle("on", i === step);
      s.classList.toggle("past", i < step);
    });
  }

  function onScroll() {
    var r = story.getBoundingClientRect();
    var vh = window.innerHeight || 800;
    var p = Math.min(1, Math.max(0, (vh * 0.55 - r.top) / Math.max(1, r.height - vh * 0.3)));
    render(Math.min(4, Math.floor(p * 5)), p);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();
})();
