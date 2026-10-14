(() => {
  "use strict";

  const config = window.DATE_CONFIG || {};
  const steps = ["invite", "date", "movie", "confirm", "done"];
  const state = { slot: null, movie: null, sending: false };
  const bangkok = "Asia/Bangkok";
  const zurich = "Europe/Zurich";

  const $ = (selector) => document.querySelector(selector);

  function showStep(name) {
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
      times.textContent = `Thailand · ${formatDate(date, zurich, { weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })} Switzerland`;
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
  }

  function selectionDetails() {
    const date = new Date(state.slot);
    const movie = (config.movies || []).find((item) => item.id === state.movie);
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

  // A small playful dodge for pointer users; keyboard users can still reach both buttons.
  const noButton = $("#no-button");
  const noMessages = ["Are you suuure? 👀", "This button is feeling shy 🙈", "Maybe try the pink one? 💗"];
  let dodges = 0;
  function dodge() {
    dodges += 1;
    const x = [-42, 50, -20, 38][dodges % 4];
    const y = [-18, 16, 22, -20][dodges % 4];
    noButton.style.transform = `translate(${x}px, ${y}px) rotate(${dodges % 2 ? -5 : 5}deg)`;
    $("#no-message").textContent = noMessages[(dodges - 1) % noMessages.length];
  }
  noButton.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "mouse") dodge();
  });
  noButton.addEventListener("click", () => {
    dodge();
    $("#no-message").textContent = "No pressure. The invitation is here whenever you want it ♡";
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
    appendSummary($("#summary"));
    showStep("confirm");
  });

  $("#confirm-button").addEventListener("click", async () => {
    if (state.sending) return;
    const error = $("#submit-error");
    error.textContent = "";
    const name = $("#guest-name").value.trim();
    if (!name) {
      error.textContent = "Please add your name first ♡";
      $("#guest-name").focus();
      return;
    }
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
          _subject: `E-date choice from ${name}`,
          name,
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
