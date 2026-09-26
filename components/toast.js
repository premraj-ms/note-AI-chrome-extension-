// Toast Notification Component

export function showToast(message, duration = 2200) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.remove("hidden");

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.add("hidden");
  }, duration);
}
