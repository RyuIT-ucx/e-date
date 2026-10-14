# A little date for Nam Tan ♡

A static, English invitation page made for GitHub Pages. It has a playful invitation, date slots shown in Thailand and Switzerland time, a movie choice, and an email booking form.

## Before sharing it

Edit [`config.js`](config.js):

1. Review `availability`. It currently reflects the supplied Swiss time windows: 16 October 16:00 through 18 October 00:00, 19 October 12:00 through 20 October 00:00, then from 22 October 12:00 onward. Dates can be selected through 14 January 2027. Only start times that leave three hours inside an available window appear. Times are offered every 30 minutes and displayed in Thailand time with the matching Swiss time.
2. Replace the example `movies` with the actual film choices once you decide them. Each `id` should be unique.
3. Activate and test FormSubmit email delivery (below).

### Receive her choices by email

GitHub Pages serves static files and cannot save bookings itself. This project sends the confirmed choice to [FormSubmit](https://formsubmit.co/) using its AJAX endpoint.

1. Submit a test booking to `https://formsubmit.co/ajax/YOUR_EMAIL_ADDRESS` from the published domain. FormSubmit emails a one-time activation link to that address. Activate it; the email also contains a random alias for the address.
2. Set `bookingEndpoint` in `config.js` to `https://formsubmit.co/ajax/YOUR_RANDOM_ALIAS` and publish the update.
3. Submit a second test booking and check that the email arrives. Check spam if needed.

The FormSubmit alias keeps the recipient email out of the public source. A form service still processes the booking details.

Do not send the page link until the test email succeeds.

### Publish with GitHub Pages

Once this repository is on GitHub, open **Settings → Pages** and choose **Deploy from a branch**, branch `main`, folder `/ (root)`. The address will be `https://YOUR_USERNAME.github.io/REPOSITORY_NAME/`.

To create and push the repository with GitHub CLI after signing in:

```bash
gh auth login
cd /home/ave/Projects/nam-tan-e-date
gh repo create nam-tan-e-date --public --source=. --remote=origin --push
```

GitHub Free requires a public repository for Pages. Paid plans also support Pages from a private repository; in that case you can change `--public` to `--private`. **A public repository exposes the page and all source files**, including configured email and movie titles. A published Pages site is publicly accessible even when its source repository is private.

## Watching together

The page arranges the date; it does not stream a film. Pick a film you can both access legally, send each other the viewing link and call link, and press play together. If you have a film you are allowed to host yourself, a separate video page can be added later. Avoid adding large video files to this Git repository.

## Local preview

Run `python3 -m http.server 8000` in this directory and open `http://localhost:8000`.
