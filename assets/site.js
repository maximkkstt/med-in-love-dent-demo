document.documentElement.classList.add("js");
const menu = document.querySelector(".hamb");
const navigation = document.querySelector("#navigation");
menu.hidden = false;
function showMenu(open) {
  menu.setAttribute("aria-expanded", String(open));
  menu.setAttribute("aria-label", open ? "Закрыть меню" : "Меню");
  navigation.classList.toggle("open", open);
}
menu.addEventListener("click", event => {
  const open = menu.getAttribute("aria-expanded") !== "true";
  showMenu(open);
  if (open && event.detail === 0) navigation.querySelector("a")?.focus();
});
function closeMenuOutside(event) {
  if (menu.getAttribute("aria-expanded") === "true" && !event.target.closest(".mast")) showMenu(false);
}
document.addEventListener("pointerdown", closeMenuOutside);
document.addEventListener("focusin", closeMenuOutside);
navigation.addEventListener("click", () => showMenu(false));
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && menu.getAttribute("aria-expanded") === "true") {
    showMenu(false);
    menu.focus();
  }
});
const priceTools = document.querySelector(".price-tools");
if (priceTools) {
  priceTools.hidden = false;
  const input = priceTools.querySelector("input");
  const buttons = Array.from(priceTools.querySelectorAll("button"));
  const countLabel = document.querySelector("#price-count");
  const reset = document.querySelector("#price-reset");
  const more = document.querySelector("#search-all");
  const emptyState = document.querySelector("#no-results");
  const advice = document.querySelector("#search-advice");
  const normalize = value => value.toLocaleLowerCase("ru").replaceAll("ё", "е")
    .replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  const groups = Array.from(document.querySelectorAll("[data-group]"), section => ({
    section,
    items: Array.from(section.querySelectorAll("[data-price]"), row => ({
      row,
      name: normalize(row.cells[0].textContent),
      terms: normalize(row.cells[0].textContent + " " + row.dataset.price).split(" ")
    }))
  }));
  let active = "all";
  function filterPrices() {
    const query = normalize(input.value).replace(/^сколько стоит\s+/u, "");
    const words = query ? query.split(" ") : [];
    let total = 0;
    let visible = 0;
    for (const {section, items} of groups) {
      const inSection = active === "all" || active === section.dataset.group;
      let shown = 0;
      for (const {row, terms, name} of items) {
        const matches = name.includes(query) || words.every(word => terms.some(term => term.startsWith(word)));
        if (matches) total++;
        row.hidden = !(matches && inSection);
        if (!row.hidden) shown++;
      }
      section.hidden = shown === 0;
      visible += shown;
    }
    const filtered = input.value.length > 0 || active !== "all";
    countLabel.textContent = filtered ? "Найдено позиций — " + visible : "";
    reset.hidden = !filtered;
    emptyState.hidden = visible > 0;
    more.hidden = visible > 0 || total === 0;
    advice.textContent = total ? "В других разделах прайса есть совпадения."
      : "Попробуйте другое название услуги или уточните её стоимость по телефону.";
  }
  function selectSection(value) {
    active = value;
    for (const item of buttons) item.setAttribute("aria-pressed", String(item.dataset.filter === value));
    filterPrices();
  }
  input.addEventListener("input", filterPrices);
  for (const button of buttons) {
    button.addEventListener("click", () => selectSection(button.dataset.filter));
  }
  reset.addEventListener("click", () => {
    input.value = "";
    selectSection("all");
    input.focus();
  });
  more.addEventListener("click", () => {
    selectSection("all");
    input.focus();
  });
  filterPrices();
}
// Tag managers can subscribe without collecting phone numbers or patient information.
document.addEventListener("click", event => {
  const anchor = event.target.closest("a[href]");
  if (!anchor) return;
  const target = anchor.getAttribute("href");
  const name = target.startsWith("tel:") ? "phone_click" :
    anchor.closest(".map-actions") ? "route_click" : null;
  if (name) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({event: name});
  }
});
const copyAddress = document.querySelector("#copy-address");
if (copyAddress) {
  copyAddress.hidden = false;
  copyAddress.addEventListener("click", async () => {
    const address = document.querySelector("#clinic-address");
    const status = document.querySelector("#copy-status");
    try {
      await navigator.clipboard.writeText(address.textContent.trim());
      status.textContent = "Адрес скопирован";
    } catch {
      const range = document.createRange();
      range.selectNodeContents(address);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      status.textContent = "Адрес выделен. Скопируйте его через меню браузера.";
    }
  });
}
const teamFilters = document.querySelector(".team-filters");
if (teamFilters) {
  teamFilters.hidden = false;
  const profiles = document.querySelectorAll(".team-directory .team-card");
  const count = document.querySelector(".team-count");
  teamFilters.addEventListener("click", event => {
    const selected = event.target.closest("[data-role]");
    if (!selected) return;
    for (const button of teamFilters.querySelectorAll("button")) {
      button.setAttribute("aria-pressed", String(button === selected));
    }
    let visible = 0;
    for (const profile of profiles) {
      profile.hidden = selected.dataset.role !== "" && selected.dataset.role !== profile.dataset.specialty;
      if (!profile.hidden) visible++;
    }
    count.textContent = "Профилей в списке — " + visible;
  });
}
const booking = document.querySelector("#booking-demo");
if (booking) {
  const service = booking.querySelector("#visit-service");
  const patient = booking.querySelector("#visit-name");
  const phone = booking.querySelector("#visit-phone");
  const day = booking.querySelector("#visit-day");
  const time = booking.querySelector("#visit-time");
  const preview = document.querySelector("#booking-result");
  const preferences = booking.querySelector(".booking-preferences");
  const rateNote = booking.querySelector("#selected-rate");
  const rates = JSON.parse(document.querySelector("#booking-rates").textContent);
  const params = new URLSearchParams(location.search);
  const requested = booking.dataset.service || params.get("usluga");
  const item = booking.dataset.item || params.get("poziciya");
  function selectedPrice() {
    const group = rates[service.value];
    if (!group) return null;
    if (service.value === requested && Object.hasOwn(group, item)) return group[item];
    return Object.values(group)[0];
  }
  function showPrice() {
    const rate = selectedPrice();
    rateNote.hidden = !rate;
    rateNote.textContent = rate ? rate[0] + " — " + rate[1] + " BYN по прайсу" : "";
  }
  service.addEventListener("change", showPrice);
  function resetBooking() {
    booking.reset();
    preferences.open = false;
    phone.setCustomValidity("");
    if (Array.from(service.options).some(option => option.value === requested)) {
      service.value = requested;
    }
    showPrice();
    day.min = new Intl.DateTimeFormat("sv-SE", {timeZone: "Europe/Minsk"}).format(new Date());
    for (const field of preview.querySelectorAll("[data-value]")) field.textContent = "";
    preview.hidden = true;
    booking.hidden = false;
  }
  day.addEventListener("invalid", () => { preferences.open = true; });
  phone.addEventListener("input", () => phone.setCustomValidity(""));
  booking.addEventListener("submit", event => {
    event.preventDefault();
    const digits = phone.value.replace(/\D/g, "");
    const validPhone = /^[+\d\s()-]+$/.test(phone.value) && digits.length >= 7 && digits.length <= 15;
    phone.setCustomValidity(validPhone ? "" : "Введите тестовый номер из 7–15 цифр.");
    if (!booking.reportValidity()) return;
    const date = day.valueAsDate;
    const visitDate = date ? date.toLocaleDateString("ru-BY", {timeZone: "UTC", day: "numeric", month: "long", year: "numeric"}) : "Дата по договорённости";
    const values = {
      service: rateNote.hidden ? service.selectedOptions[0].textContent : rateNote.textContent,
      name: patient.value.trim(),
      phone: phone.value.trim(),
      visit: visitDate + " · " + time.value
    };
    for (const field of preview.querySelectorAll("[data-value]")) {
      field.textContent = values[field.dataset.value];
      field.hidden = !field.textContent;
      field.previousElementSibling.hidden = field.hidden;
    }
    booking.hidden = true;
    preview.hidden = false;
    document.querySelector("#result-heading").focus();
  });
  document.querySelector("#edit-booking").addEventListener("click", () => {
    preview.hidden = true;
    booking.hidden = false;
    service.focus();
  });
  window.addEventListener("pageshow", event => { if (event.persisted) resetBooking(); });
  window.addEventListener("pagehide", resetBooking);
  resetBooking();
}

function setupServiceFolio(folio) {
  const slides = Array.from(folio.querySelectorAll(".folio-slide"));
  const rows = Array.from(folio.querySelectorAll(".folio-row"));
  const controls = folio.querySelector(".folio-controls");
  if (slides.length < 2) return;
  const [previous, next] = controls.querySelectorAll("button");
  const counter = controls.querySelector(".folio-index");
  const status = controls.querySelector(".folio-status");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const fine = matchMedia("(hover: hover) and (pointer: fine)");
  let current = 0;
  let requested = 0;
  let direction = 1;
  let announce = false;
  let running = false;
  let animations = [];

  reduced.addEventListener("change", () => {
    if (reduced.matches) animations.forEach(animation => animation.finish());
  });

  async function render() {
    if (running) return;
    running = true;
    try {
      while (requested !== current) {
        const target = requested;
        const incoming = slides[target];
        const media = incoming.querySelector(".folio-media");
        const image = media.querySelector("img");
        image.loading = "eager";
        await image.decode().catch(() => {});
        if (target !== requested) continue;
        const outgoing = slides[current];
        outgoing.classList.replace("is-current", "is-leaving");
        outgoing.inert = true;
        outgoing.setAttribute("aria-hidden", "true");
        incoming.inert = false;
        incoming.removeAttribute("aria-hidden");
        incoming.classList.add("is-current");
        rows[current].classList.remove("is-current");
        rows[target].classList.add("is-current");
        current = target;
        counter.textContent = [current + 1, slides.length].map(n => String(n).padStart(2, "0")).join(" / ");
        if (announce) status.textContent = incoming.querySelector(".folio-title").textContent;
        try {
          if (!reduced.matches && media.animate) {
            const start = direction > 0 ? "100% 0, 100% 0, 100% 100%, 107% 100%" : "0 0, 0 0, -7% 100%, 0 100%";
            const timing = { duration: 560, easing: "cubic-bezier(.55,.04,.18,1)" };
            animations = [
              media.animate([{clipPath: "polygon(" + start + ")"}, {clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)"}], timing),
              image.animate([{transform: "translateX(" + (direction * 2) + "%) scale(1.06)"}, {transform: "none"}], timing),
              outgoing.querySelector("img").animate([{transform: "none"}, {transform: "scale(1.04)"}], timing)
            ];
            await Promise.allSettled(animations.map(animation => animation.finished));
          }
        } finally {
          outgoing.classList.remove("is-leaving");
          animations = [];
        }
      }
    } finally {
      running = false;
    }
  }
  function select(index, step, manual) {
    requested = (index + slides.length) % slides.length;
    direction = step;
    announce = manual;
    render();
  }
  rows.forEach((row, index) => {
    row.addEventListener("pointerenter", event => {
      if (fine.matches && event.pointerType === "mouse") select(index, Math.sign(index - current), false);
    });
    row.addEventListener("focus", () => select(index, Math.sign(index - current), false));
  });
  previous.addEventListener("click", () => select(requested - 1, -1, true));
  next.addEventListener("click", () => select(requested + 1, 1, true));
  controls.hidden = false;
}

document.querySelectorAll(".service-folio").forEach(setupServiceFolio);
