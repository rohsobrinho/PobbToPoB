(function () {
  var TARGET_URL =
    "https://assets.pobb.in/1/Art/2DArt/UIImages/Common/IconStr_Berserker.webp";
  var CHECK_INTERVAL_MS = 30000;
  var REQUEST_TIMEOUT_MS = 5000;
  var container = null;
  var dot = null;
  var text = null;

  function ensureBadge() {
    if (container) return;

    container = document.createElement("div");
    container.setAttribute("id", "pobb-status-indicator");
    container.style.position = "fixed";
    container.style.top = "12px";
    container.style.left = "12px";
    container.style.zIndex = "9999";
    container.style.display = "inline-flex";
    container.style.alignItems = "center";
    container.style.gap = "8px";
    container.style.padding = "8px 10px";
    container.style.borderRadius = "999px";
    container.style.background = "rgba(15, 23, 42, 0.92)";
    container.style.border = "1px solid rgba(148, 163, 184, 0.45)";
    container.style.boxShadow = "0 8px 18px rgba(0, 0, 0, 0.35)";
    container.style.color = "#f8fafc";
    container.style.fontSize = "12px";
    container.style.fontFamily = "inherit";
    container.style.letterSpacing = "0.04em";
    container.style.textTransform = "uppercase";

    dot = document.createElement("span");
    dot.style.width = "10px";
    dot.style.height = "10px";
    dot.style.borderRadius = "999px";
    dot.style.display = "inline-block";
    dot.style.background = "#f59e0b";

    text = document.createElement("span");
    text.textContent = "Status: verificando";

    container.appendChild(dot);
    container.appendChild(text);
    document.body.appendChild(container);
  }

  function setStatus(online) {
    ensureBadge();
    if (!dot || !text) return;

    dot.style.background = online ? "#22c55e" : "#ef4444";
    text.textContent = online ? "pobb.in Status: online" : "pobb.in Status: offline";
  }

  function checkOnlineStatus() {
    return new Promise(function (resolve) {
      var img = new Image();
      var done = false;
      var timeout = window.setTimeout(function () {
        if (done) return;
        done = true;
        resolve(false);
      }, REQUEST_TIMEOUT_MS);

      function finish(value) {
        if (done) return;
        done = true;
        window.clearTimeout(timeout);
        resolve(value);
      }

      img.onload = function () {
        finish(true);
      };
      img.onerror = function () {
        finish(false);
      };
      img.src = TARGET_URL + "?t=" + Date.now();
    });
  }

  function start() {
    ensureBadge();
    checkOnlineStatus().then(setStatus);
    window.setInterval(function () {
      checkOnlineStatus().then(setStatus);
    }, CHECK_INTERVAL_MS);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
