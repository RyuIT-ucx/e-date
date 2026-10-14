(() => {
  "use strict";

  const config = window.DATE_CONFIG || {};
  const steps = ["invite", "date", "movie", "confirm", "done"];
  const state = { slot: null, movie: null, sending: false };
  const bangkok = "Asia/Bangkok";
  const zurich = "Europe/Zurich";

  const $ = (selector) => document.querySelector(selector);

  function showStep(name) {
    if (name !== "invite") resetNoButton();
    steps.forEach((step) => {
      const section = $(`#${step}-step`);
      const active = step === name;
      section.hidden = !active;
      section.classList.toggle("step--active", active);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
    $(`#${name}-step h1, #${name}-step h2`)?.focus({ preventScroll: true });
  }

  function formatDate(date, zone, options) {
    return new Intl.DateTimeFormat("en-GB", { timeZone: zone, ...options }).format(date);
  }

  function bangkokDateKey(date) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: bangkok, year: "numeric", month: "2-digit", day: "2-digit"
    }).formatToParts(date);
    const part = (type) => parts.find((item) => item.type === type).value;
    return `${part("year")}-${part("month")}-${part("day")}`;
  }

  function availableTimes(dateKey) {
    if (!dateKey) return [];
    const result = [];
    const step = config.timeStepMinutes || 30;
    const duration = (config.dateDurationMinutes || 180) * 60_000;
    const now = Date.now();
    for (let minute = 0; minute < 24 * 60; minute += step) {
      const hourText = String(Math.floor(minute / 60)).padStart(2, "0");
      const minuteText = String(minute % 60).padStart(2, "0");
      const iso = `${dateKey}T${hourText}:${minuteText}:00+07:00`;
      const date = new Date(iso);
      const start = date.getTime();
      if (start <= now) continue;
      const fits = (config.availability || []).some((window) => {
        const windowStart = new Date(window.start).getTime();
        const windowEnd = window.end ? new Date(window.end).getTime() : Infinity;
        return start >= windowStart && start + duration <= windowEnd;
      });
      if (fits) result.push({ iso, date });
    }
    return result;
  }

  function firstAvailableDay(min, max) {
    const cursor = new Date(`${min}T00:00:00+07:00`);
    const limit = new Date(`${max}T00:00:00+07:00`);
    while (cursor <= limit) {
      const key = bangkokDateKey(cursor);
      if (availableTimes(key).length) return key;
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return min;
  }

  function renderSlots() {
    const list = $("#slot-list");
    const slots = availableTimes($("#date-picker").value);

    list.replaceChildren();
    if (!slots.length) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "No time fits on this day. Try another date ♡";
      list.append(empty);
      return;
    }

    slots.forEach(({ iso, date }) => {
      const label = document.createElement("label");
      label.className = "choice-card slot-card";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "date-slot";
      input.value = iso;
      input.checked = state.slot === iso;
      input.addEventListener("change", () => {
        state.slot = iso;
        $("#slot-error").textContent = "";
      });
      const dot = document.createElement("span");
      dot.className = "choice-dot";
      dot.setAttribute("aria-hidden", "true");
      const copy = document.createElement("span");
      copy.className = "slot-copy";
      const day = document.createElement("strong");
      day.textContent = formatDate(date, bangkok, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
      const times = document.createElement("small");
      times.textContent = `Switzerland: ${formatDate(date, zurich, { weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })}`;
      copy.append(day, times);
      label.append(input, dot, copy);
      list.append(label);
    });
  }

  function renderMovies() {
    const list = $("#movie-list");
    list.replaceChildren();
    (config.movies || []).forEach((movie) => {
      const label = document.createElement("label");
      label.className = "choice-card movie-card";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "movie";
      input.value = movie.id;
      input.checked = state.movie === movie.id;
      input.addEventListener("change", () => {
        state.movie = movie.id;
        $("#movie-error").textContent = "";
      });
      const icon = document.createElement("span");
      icon.className = "movie-icon";
      icon.textContent = movie.icon;
      const copy = document.createElement("span");
      copy.className = "movie-copy";
      const title = document.createElement("strong");
      title.textContent = movie.title;
      const description = document.createElement("small");
      description.textContent = movie.description;
      copy.append(title, description);
      const dot = document.createElement("span");
      dot.className = "choice-dot";
      dot.setAttribute("aria-hidden", "true");
      label.append(input, icon, copy, dot);
      list.append(label);
    });

    const custom = document.createElement("div");
    custom.className = "custom-movie";
    const label = document.createElement("label");
    label.className = "choice-card movie-card";
    label.htmlFor = "custom-movie-radio";
    const radio = document.createElement("input");
    radio.id = "custom-movie-radio";
    radio.type = "radio";
    radio.name = "movie";
    radio.value = "custom";
    radio.checked = state.movie === "custom";
    radio.addEventListener("change", () => {
      state.movie = "custom";
      $("#movie-error").textContent = "";
      $("#custom-movie-title").focus();
    });
    const icon = document.createElement("span");
    icon.className = "movie-icon";
    icon.textContent = "🎬";
    const copy = document.createElement("span");
    copy.className = "movie-copy";
    const title = document.createElement("strong");
    title.textContent = "Suggest your own movie";
    const description = document.createElement("small");
    description.textContent = "Pick any movie. I’ll sort out where we can watch it together.";
    copy.append(title, description);
    const dot = document.createElement("span");
    dot.className = "choice-dot";
    dot.setAttribute("aria-hidden", "true");
    label.append(radio, icon, copy, dot);
    const movieInput = document.createElement("input");
    movieInput.id = "custom-movie-title";
    movieInput.className = "text-input custom-movie-input";
    movieInput.type = "text";
    movieInput.maxLength = 120;
    movieInput.placeholder = "Movie title…";
    movieInput.setAttribute("aria-label", "Your movie suggestion");
    movieInput.addEventListener("focus", () => {
      radio.checked = true;
      state.movie = "custom";
    });
    movieInput.addEventListener("input", () => {
      radio.checked = true;
      state.movie = "custom";
      $("#movie-error").textContent = "";
    });
    custom.append(label, movieInput);
    list.append(custom);
  }

  function selectionDetails() {
    const date = new Date(state.slot);
    const movie = state.movie === "custom"
      ? { title: $("#custom-movie-title").value.trim() }
      : (config.movies || []).find((item) => item.id === state.movie);
    return {
      date,
      movie,
      bangkokTime: formatDate(date, bangkok, { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }),
      swissTime: formatDate(date, zurich, { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
    };
  }

  function appendSummary(container) {
    const { movie, bangkokTime, swissTime } = selectionDetails();
    container.replaceChildren();
    for (const [label, value] of [
      ["THAILAND TIME", bangkokTime],
      ["SWITZERLAND TIME", swissTime],
      ["OUR MOVIE", movie.title]
    ]) {
      const row = document.createElement("div");
      row.className = "summary-row";
      const small = document.createElement("small");
      small.textContent = label;
      const strong = document.createElement("strong");
      strong.textContent = value;
      row.append(small, strong);
      container.append(row);
    }
  }

  // Keep the playful button visible while moving it around the whole viewport.
  const noButton = $("#no-button");
  const yesButton = $("#yes-button");
  const noMessages = ["Are you suuure? 👀", "This button is feeling shy 🙈", "Maybe try the pink one? 💗", "No pressure. The invitation is here whenever you want it ♡"];
  let dodges = 0;
  let lastDodge = -Infinity;

  function resetNoButton() {
    noButton.classList.remove("is-floating");
    noButton.style.left = "";
    noButton.style.top = "";
    noButton.style.transform = "";
  }

  function moveNoButton() {
    const now = performance.now();
    if (now - lastDodge < 220) return;
    lastDodge = now;
    dodges += 1;
    const wasFloating = noButton.classList.contains("is-floating");
    const origin = noButton.getBoundingClientRect();
    if (!wasFloating) {
      noButton.classList.add("is-floating");
      noButton.style.left = `${origin.left}px`;
      noButton.style.top = `${origin.top}px`;
      noButton.getBoundingClientRect();
    }

    const viewport = window.visualViewport;
    const left = viewport?.offsetLeft || 0;
    const top = viewport?.offsetTop || 0;
    const width = viewport?.width || window.innerWidth;
    const height = viewport?.height || window.innerHeight;
    const padding = 18;
    const buttonWidth = noButton.offsetWidth;
    const buttonHeight = noButton.offsetHeight;
    const yes = yesButton.getBoundingClientRect();
    const availableX = Math.max(0, width - buttonWidth - padding * 2);
    const availableY = Math.max(0, height - buttonHeight - padding * 2);
    let destination;
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const x = left + padding + Math.random() * availableX;
      const y = top + padding + Math.random() * availableY;
      const nearYes = x < yes.right + 12 && x + buttonWidth > yes.left - 12 && y < yes.bottom + 12 && y + buttonHeight > yes.top - 12;
      const tooClose = Math.hypot(x - origin.left, y - origin.top) < Math.min(width, height) * 0.28;
      if (!nearYes && !tooClose) {
        destination = { x, y };
        break;
      }
    }
    destination ||= { x: left + padding, y: top + padding };
    const place = () => {
      noButton.style.left = `${destination.x}px`;
      noButton.style.top = `${destination.y}px`;
      noButton.style.transform = `rotate(${dodges % 2 ? -6 : 6}deg)`;
    };
    if (wasFloating) place(); else requestAnimationFrame(place);
    $("#no-message").textContent = noMessages[(dodges - 1) % noMessages.length];
  }
  noButton.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "mouse") moveNoButton();
  });
  noButton.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "mouse") {
      event.preventDefault();
      moveNoButton();
    }
  });
  noButton.addEventListener("click", (event) => { event.preventDefault(); moveNoButton(); });
  window.addEventListener("resize", () => {
    if (!noButton.classList.contains("is-floating")) return;
    const padding = 18;
    const maxLeft = Math.max(padding, window.innerWidth - noButton.offsetWidth - padding);
    const maxTop = Math.max(padding, window.innerHeight - noButton.offsetHeight - padding);
    noButton.style.left = `${Math.min(Math.max(padding, parseFloat(noButton.style.left)), maxLeft)}px`;
    noButton.style.top = `${Math.min(Math.max(padding, parseFloat(noButton.style.top)), maxTop)}px`;
  });
  $(".brand").addEventListener("click", () => showStep("invite"));
  $("#yes-button").addEventListener("click", () => showStep("date"));
  document.querySelectorAll("[data-back]").forEach((button) => button.addEventListener("click", () => showStep(button.dataset.back)));

  $("#date-next").addEventListener("click", () => {
    if (!state.slot) {
      $("#slot-error").textContent = "Pick a time for us first ♡";
      return;
    }
    showStep("movie");
  });

  $("#movie-next").addEventListener("click", () => {
    if (!state.movie) {
      $("#movie-error").textContent = "Choose our movie plan first ♡";
      return;
    }
    if (state.movie === "custom" && !$("#custom-movie-title").value.trim()) {
      $("#movie-error").textContent = "Tell me which movie you have in mind ♡";
      $("#custom-movie-title").focus();
      return;
    }
    appendSummary($("#summary"));
    showStep("confirm");
  });

  $("#confirm-button").addEventListener("click", async () => {
    if (state.sending) return;
    const error = $("#submit-error");
    error.textContent = "";
    if (!config.bookingEndpoint) {
      error.textContent = "The invitation is almost ready. Booking will open soon ♡";
      return;
    }
    const { movie, bangkokTime, swissTime } = selectionDetails();
    const button = $("#confirm-button");
    state.sending = true;
    button.disabled = true;
    button.textContent = "Sending our plan…";
    try {
      const response = await fetch(config.bookingEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          _subject: "E-date choice from Nam Tan",
          note: $("#guest-note").value.trim(),
          thailand_time: bangkokTime,
          switzerland_time: swissTime,
          date_utc: new Date(state.slot).toISOString(),
          movie: movie.title,
          _honey: ""
        })
      });
      const result = await response.json();
      if (!response.ok || result.success === false || result.success === "false") throw new Error("Submission failed");
      appendSummary($("#done-summary"));
      showStep("done");
    } catch {
      error.textContent = "That didn’t send. Please try again in a moment 💗";
    } finally {
      state.sending = false;
      button.disabled = false;
      button.innerHTML = 'Confirm our date <span aria-hidden="true">♡</span>';
    }
  });

  const datePicker = $("#date-picker");
  datePicker.min = bangkokDateKey(new Date());
  datePicker.max = config.bookingUntilThailand || datePicker.min;
  datePicker.value = firstAvailableDay(datePicker.min, datePicker.max);
  datePicker.addEventListener("change", () => {
    state.slot = null;
    $("#slot-error").textContent = "";
    renderSlots();
  });
  renderSlots();
  renderMovies();
})();
