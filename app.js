const message = document.getElementById("message");
const offline = document.getElementById("offline");
const retry = document.getElementById("retry");
let automaticRetry = null;

function validTunnel(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && /^[a-z0-9-]+\.trycloudflare\.com$/i.test(url.hostname) ? url : null;
  } catch {
    return null;
  }
}

function showOffline(detail) {
  message.textContent = detail || "The family field is not reachable yet.";
  offline.hidden = false;
  retry.disabled = false;
  clearTimeout(automaticRetry);
  automaticRetry = setTimeout(connect, 15000);
}

async function connect() {
  clearTimeout(automaticRetry);
  retry.disabled = true;
  offline.hidden = true;
  message.textContent = "Finding the family field…";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  try {
    const pointerResponse = await fetch(`current.json?check=${Date.now()}`, { cache: "no-store", signal: controller.signal });
    if (!pointerResponse.ok) throw new Error("The launcher pointer is unavailable.");
    const pointer = await pointerResponse.json();
    const target = validTunnel(pointer.target);
    if (!target || pointer.online === false) throw new Error("The home system is starting up.");
    const health = new URL("/health", target);
    health.searchParams.set("launcher", String(Date.now()));
    const healthResponse = await fetch(health, { cache: "no-store", mode: "cors", signal: controller.signal });
    if (!healthResponse.ok) throw new Error("The home system is not ready.");
    const payload = await healthResponse.json();
    if (!payload || payload.ok !== true) throw new Error("The home system is still warming up.");
    message.textContent = "Opening the huddle…";
    target.pathname = "/";
    target.search = "";
    target.hash = window.location.hash;
    window.location.replace(target.toString());
  } catch (error) {
    const text = error && error.name === "AbortError" ? "The home system did not answer in time." : "The home system may be restarting or reconnecting.";
    showOffline(text);
  } finally {
    clearTimeout(timeout);
  }
}

retry.addEventListener("click", connect);
connect();
