// Owner settings. See README.md before sharing the page.
window.DATE_CONFIG = {
  // FormSubmit alias hides the recipient email address in this public file.
  bookingEndpoint: "https://formsubmit.co/ajax/3b2952a4cab9835bd2322bfadfbc4907",

  // Your availability is written in Swiss local time. October 2026 is CEST
  // (+02:00); after the clock change, the open-ended window needs no offset.
  availability: [
    { start: "2026-10-16T16:00:00+02:00", end: "2026-10-18T00:00:00+02:00" },
    { start: "2026-10-19T12:00:00+02:00", end: "2026-10-20T00:00:00+02:00" },
    { start: "2026-10-22T12:00:00+02:00", end: null }
  ],
  bookingUntilThailand: "2027-01-14",
  dateDurationMinutes: 180,
  timeStepMinutes: 30,

  // Replace these choices with the movie titles you want to offer.
  movies: [
    { id: "horror", icon: "👻", title: "A horror night", description: "You choose the scary movie, I’ll try to act brave." },
    { id: "surprise", icon: "🎟️", title: "A mystery screening", description: "Let me surprise you with a movie we can both watch." },
    { id: "together", icon: "🍿", title: "Let’s pick together", description: "We choose something we both love before the date." }
  ]
};
