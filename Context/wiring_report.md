# Frontend Wiring: Follow-up 21, what a stranger sees

> Follow-up 21 (`Context/wiring_followups.md` §21): a link's preview with the name, a sentence and a
> picture, the icons, the manifest and no search listing (F21-1); the public pages' foot without the
> sessions' sentence (F21-2); the sign-in page's introduction (F21-3); and no technical line on the
> public message screens (F21-4). The backend's half is its round 16
> (`RWRentApi-wiring/Context/round16_report.md`), built in the same run. On `feature/backend-wiring`
> in this worktree (`/Users/zulf/rw-rent-api/rw-rent-web-wiring`); the reviewer fast-forwards `main`
> after verification. Written 2026-10-02. It replaces Follow-up 20's report, which git history keeps.
>
> **One change to §21, decided by the owner on 2026-10-02 during this run:** `robots.txt` refuses no
> robot, where §21 has it refuse every one (§7). The reviewer corrects the specification afterwards.
>
> **The owner's side was never touched.** This run never opened 5173 or 5174, never called 5001 or
> 5002, and never read or wrote `rwrent_v1` or `rwrent_check`. Nothing was sent to the server, to
> `https://rw-rent.net` or to `https://api.rw-rent.net`.
>
> - Both of the owner's apps hot-reload from this worktree, so they show this run's code and files
>   (§8, item 1).
> - Every live look used this run's own stack: round 16's API on 5003 over `rwrent_r16`, this run's
>   Vite on 5176 against it, and the built app served from a scratch folder on 5175 (§4.1).
> - **For the reviewer: §5 lists how each thing of F21-1 is seen**, the tags, the picture, the icons
>   and the files answered as themselves, and the public pages' steps.

## 1. Summary

- **F21-1, a link to the app shows its name, a sentence and a picture.**
  - `index.html` carries the description, the Open Graph and Twitter tags, the theme colour, the
    icons, the manifest and `noindex`.
  - The picture, `og-image.png`, is 1200 by 630 in the app's dark look: the monogram in the brand's
    red, "RW-Rent" in the wordmark's type, and "Control at every turn." in the display type, over the
    sign-in page's monogram pattern. It is made from `brand/og-image.html` by one command,
    `node brand/make.cjs`.
  - The tab's icon is an SVG of the monogram, with a `favicon.ico` holding 16, 32 and 48 for browsers
    that ask for one. The iPhone's home-screen icon is 180 by 180 on the dark ground, and the
    manifest names the app and its 192 and 512 icons.
  - Every one of these is a real file of `public/`, which the build copies beside the page. Asked
    for by its address, each is answered as itself, on Vite and on the built app.
  - `robots.txt` refuses no robot, and the page says `noindex`: the owner's decision (§7).
- **F21-2.** The public pages' foot reads "RW-Rent operations platform · v1.0.0".
- **F21-3.** The sign-in page's introduction is "Fleet and rental operations for RW-Rent."
- **F21-4.** No public message screen shows a technical line, whatever the API answered. The note
  under a link's form reads "This link works once. It has been removed from this page's address."

| | |
|---|---|
| Commits | two `Wiring 53` commits and this report's `Wiring 54`, on `feature/backend-wiring` (§9) |
| Tests | 761 before, **786** now, all green: 25 new, 1 changed on purpose (§2.5) |
| Typecheck, build | green; the build's chunk-size warning predates this run |
| Each commit alone | 0 type errors and the full suite green at each of the two (§4.4) |
| Planted breakages | **37 planted, 37 caught**: 26 for F21-1, 4 for F21-2 and F21-3, 5 for F21-4, 2 for what stays (§4.3) |
| In a browser | the public pages on 5176 against 5003, a link the real API refuses among them; each file asked for by its address on 5176 and on the built app (§4.2) |
| A messenger | **not seen**: no messenger can read this Mac, and the live site has the old page until it is deployed (§8, item 2) |

## 2. Implemented

### 2.1 F21-1: the page's tags (`index.html`)

| Tag | Value |
|---|---|
| `description` | Fleet and rental operations for RW-Rent: vehicles, rentals, drivers, customers and insurance cases in one place. |
| `robots` | `noindex` |
| `theme-color` | `#0A0A0B`, the dark theme's canvas |
| `og:type`, `og:site_name`, `og:title` | `website`, `RW-Rent`, `RW-Rent` |
| `og:description` | the description |
| `og:url` | `https://rw-rent.net/` |
| `og:image` and its `type`, `width`, `height`, `alt` | `https://rw-rent.net/og-image.png`, `image/png`, `1200`, `630`, "RW-Rent. Control at every turn." |
| `twitter:card`, `title`, `description`, `image`, `image:alt` | `summary_large_image` and the same name, sentence, picture and text |
| `link rel="icon"` | `/favicon.ico` with `sizes="48x48"`, then `/favicon.svg` as `image/svg+xml` |
| `link rel="apple-touch-icon"` | `/apple-touch-icon.png` |
| `link rel="manifest"` | `/site.webmanifest` |

A messenger's robot runs no script, so these stand in the page as it is written, the same for every
address of the app. The picture's and the page's addresses are whole ones, as a messenger wants.

### 2.2 F21-1: the files (`public/`, new) and their sources (`brand/`, new)

| File | What it is | Made from |
|---|---|---|
| `og-image.png` | 1200 by 630, 101,922 bytes | `brand/og-image.html`, by the command |
| `apple-touch-icon.png` | 180 by 180, the monogram on the dark ground | `brand/icon.html`, by the command |
| `icon-192.png`, `icon-512.png` | the manifest's icons, the same drawing | `brand/icon.html`, by the command |
| `favicon.ico` | 16, 32 and 48, each a PNG with no ground | `brand/icon.html?ground=none`, by the command |
| `favicon.svg` | the monogram's two paths in the brand's red | written by hand |
| `site.webmanifest` | the name, the description, the colours and the three icons | written by hand |
| `robots.txt` | `User-agent: *`, `Allow: /`, with the reason above them | written by hand |

- **The one command:** `node brand/make.cjs`. It opens each source page in Chromium at the picture's
  size and takes its picture. Chromium comes with Playwright from
  `/Users/zulf/rw-rent-api/testing-scratch/node_modules`, or from the folder `RWRENT_PLAYWRIGHT`
  names; this project gained no dependency.
- **The typefaces** are the sign-in page's own: Poppins 600 for the name, as the wordmark is set, and
  Michroma for the line. They come from Google's servers, as the app's do, so the command needs the
  network. It stops, rather than draw the name in another face, if either has not loaded.
- **`brand/made.json`** holds the fingerprints of the three sources and the five files the command
  wrote. A test compares them with the repository, so a source changed without the command run
  again, or a picture changed by hand, fails the suite. Run twice here, the command made the same
  bytes.
- **The monogram** is drawn from the same two paths as the sign-in page's logo, and the colours are
  the dark theme's; tests hold both equal to `AuthLayout.tsx` and `tokens.css`.
- **Everything of the picture that matters stands in its middle 630 by 630,** which is what a
  messenger keeps when it cuts a picture square.
- `README.md` gained a short section on these files and the command.

### 2.3 F21-2 and F21-3 (`src/pages/account/AuthLayout.tsx`, `SignIn.tsx`)

- The foot lost its second dot and "Sessions expire after 2 h idle, 12 h absolute".
- The sign-in page's introduction lost "Your session stays signed in on this browser until it
  expires."
- Unchanged, as §21 says: the art's two lines; the Profile page's and the user record's sentence
  about sessions; the "Session expired" screen.

### 2.4 F21-4 (`outcomes.ts`, `AuthLayout.tsx` and four pages)

- **The mono line is gone from the screens that had one:** "code:
  registration_confirmation_token_unusable", "code: password_reset_token_unusable" and "HTTP 429 ·
  retry-after: 60 s".
- **No page can hand a screen a code any more.** The message screen, `AuthOutcome`, no longer takes
  a line, and the four link pages no longer pass the API's code to it: the registration's
  confirmation, the email change, the password reset and the transfer. The line's style is removed.
- Each screen's title, body, facts and actions are as they were. "Too many attempts" keeps its body.
- The note under a link's form, `TokenNote`, reads "This link works once. It has been removed from
  this page's address."

### 2.5 Tests

**25 new test cases, 1 changed on purpose** (761 before, 786 now).

| File | Cases | What they hold |
|---|---|---|
| `pages/followup21.preview.test.ts` | 16 | the page's tags read as a robot reads them, each value and each once; the picture's size from its own bytes, equal to the tags', and its ground; the picture's source: the paths, the name's type, the line, the colours; the icon links and the theme colour; the SVG's paths; the `.ico`'s three sizes, each a PNG with no ground; the iPhone's icon; the manifest whole, each icon a file of the size it says; `noindex`; `robots.txt`'s two rules; `public/` holding exactly these eight files; every file the page names existing; the fingerprints of `brand/made.json` |
| `pages/followup21.public.render.test.ts` | 9 | nine public pages rendered: each foot's two texts and one dot; the version's type and the art's lines; the sign-in introduction; every message screen with its title, facts and actions and no line; the three that had one; a dead link in a person's words on three pages; no page passing a line, read from the sources; the note's words on two forms; what stays |

**Changed on purpose:** `pages/account/outcomes.test.ts`, "names the refusal code on the two link
screens", expected the dead confirmation link's and the dead reset link's line to contain `code:`.
It is now "carries no technical line on any screen": no screen has such a line, none of their words
reads like a code, and "Too many attempts" keeps its body.

## 3. Not implemented or partial

Nothing of §21, with the one change of §7. What a messenger shows could not be seen here (§8, item 2).

## 4. Verification

### 4.1 The stack

- **The API:** round 16's, on 5003 over `rwrent_r16` (the backend's report §7).
- **The app:** this run's Vite on 5176 from this worktree, with `VITE_API_BASE_URL=http://localhost:5003`.
- **The built app:** `vite build` into a scratch folder, served by `vite preview` on 5175.
- Both ran from launch entries added to the workspace's `.claude/launch.json` for the run and removed
  after it; the file is as it was. Both are stopped.

### 4.2 In a browser and by address

**Each file asked for by its address,** on 5176 and on the built app on 5175, the same on both:

| Address | Answered with | The bytes |
|---|---|---|
| `/og-image.png` | 200 `image/png`, 101,922 bytes | the file's own |
| `/favicon.svg` | 200 `image/svg+xml`, 1,037 bytes | the file's own |
| `/favicon.ico` | 200 `image/x-icon`, 3,305 bytes | the file's own |
| `/apple-touch-icon.png` | 200 `image/png`, 3,288 bytes | the file's own |
| `/icon-192.png` | 200 `image/png`, 3,536 bytes | the file's own |
| `/icon-512.png` | 200 `image/png`, 9,300 bytes | the file's own |
| `/site.webmanifest` | 200 `application/manifest+json`, 566 bytes | the file's own |
| `/robots.txt` | 200 `text/plain`, 314 bytes | the file's own |
| `/no-such-file.png`, `/drivers` | 200 `text/html` | the app's page, as before for an address with no file |

**The pages on 5176, signed out, against 5003:**

- **Sign in:** the introduction "Fleet and rental operations for RW-Rent."; the foot "RW-Rent
  operations platform · v1.0.0"; the art's "Control at every turn." The browser read all 18 tags and
  4 links of §2.1 from the page, fetched the icons, the manifest, the picture and `robots.txt` with
  their types, and read the manifest's name and three icons.
- **`/confirm-registration-email` with a made-up link:** the real API refused it, 400. The screen
  reads "This confirmation link cannot be used", its body, "Confirmation links are valid for 24 hours
  and work once.", and its two actions. Nothing on it is in the mono type, and no code is shown.
- **`/reset-password` and `/accept-administrator-transfer` with a made-up link:** each form's note
  reads "This link works once. It has been removed from this page's address."
- **Not looked at in a browser:** the dead reset link's screen and the dead transfer link's, which
  need a password typed into the form, and "Too many attempts", which needs the API to answer 429.
  The tests render all three.

### 4.3 The planted breakages: 37 planted, 37 caught

Each changed one thing in a copy of the commit taken with `git archive`, never the worktree; the
whole suite and the typecheck ran in the copy; the files were then written back, and the copy ran
clean at the end, 786 green. A breakage counts as caught only when a test failed.

| # | The breakage | Caught by |
|---|---|---|
| P1 | the page has no description | the title and description |
| P2 | the picture's address is not a whole one | the Open Graph tags; the files named |
| P3 | `og:url` names the address planned before | the Open Graph tags |
| P4 | the tags give the picture another width | the Open Graph tags; the picture's size |
| P5 | the Twitter card is the small one | the Twitter tags |
| P6 | the site's name is not given | the Open Graph tags |
| P7 | the preview's sentence is another than the page's | the Open Graph tags |
| P8 | the picture has no text for it | the Open Graph tags |
| P9 | the Twitter tags name another picture | the Twitter tags; the files named |
| P10 | the picture is not 1200 by 630 | the picture's size; the fingerprints |
| P11 | the picture was changed by hand after the command made it | the picture's test; the fingerprints |
| P12 | the source's line changed and the picture was not made again | the source's test; the fingerprints |
| P13 | the source sets the name in another type | the source's test; the fingerprints |
| P14 | the picture is gone | four tests |
| P15 | the tab's SVG icon lost a path | the SVG's test |
| P16 | the page names no `.ico` | the links; the files named |
| P17 | the iPhone's icon is not 180 by 180 | the iPhone's icon; the fingerprints |
| P18 | the page names no home-screen icon | the links; the files named |
| P19 | the theme colour is not the app's dark ground | the links and theme colour |
| P20 | the manifest names the app "RWRent" | the manifest |
| P21 | the manifest names an icon that is not there | the manifest |
| P22 | the page names no manifest | the links; the files named |
| P23 | the icons' source draws on a white ground | the icons' source; the fingerprints |
| P24 | the page does not say `noindex` | the `noindex` test |
| P25 | `robots.txt` refuses every robot | the `robots.txt` test |
| P26 | the build takes its public files from another folder | the test of `public/` |
| Q1 | the sessions' sentence is back in the foot | the foot's test |
| Q2 | the foot loses its version | the foot's two tests |
| Q3 | the sign-in page speaks of the session again | the introduction's test |
| Q4 | the art's line is gone | the art's test; the picture's source test |
| Q5 | a message screen draws a technical line again | four tests |
| Q6 | "Too many attempts" shows the HTTP status again | the screens' test; the outcomes' test |
| Q7 | a link page shows the API's code in the screen's body | the link pages' test; the sources' test |
| Q8 | the note under a link's form speaks of a token again | the note's test |
| Q9 | "Too many attempts" loses the sentence that the pause is short | the three screens' test; the outcomes' test |
| Q10 | the Profile page no longer explains sessions | the test of what stays |
| Q11 | the expired-session screen no longer says why | the same |

### 4.4 The test suite, and each commit

- `npx vitest run`: **786 passed**, 72 files. `tsc -b --noEmit`: 0 errors.
- `vite build` into a scratch folder: green, with the chunk-size warning that predates this run; the
  eight files stand beside `index.html` in the build.
- Each commit exported alone with `git archive`, typechecked and tested:

| Commit | Type errors | Tests |
|---|---|---|
| `be37ced` | 0 | 777 |
| `c4ac55d` | 0 | 786 |

### 4.5 The owner's side, untouched

- 5001 is pid 83735 and 5002 pid 83612, as at the start; neither was called.
- 5173 is pid 24831 and 5174 pid 58932, as at the start; neither was opened.
- `rwrent_v1` and `rwrent_check` were never addressed.

### 4.6 End state

- **The API on 5003 is left running**, round 16's, over `rwrent_r16` (the backend's report §7).
- **Nothing else of this run runs.** The Vite on 5176 and the built app on 5175 are stopped.

## 5. For the reviewer: how each thing is seen

### 5.0 Before you start

- **Start Vite on 5176 from this worktree:**
  `VITE_API_BASE_URL=http://localhost:5003 npm run dev -- --port 5176 --strictPort`
- No sign-in is needed for anything below but §5.2 step 6.

### 5.1 F21-1

1. **The tags.** `curl -s http://localhost:5176/ | grep -E 'description|robots|theme-color|og:|twitter:|rel="(icon|apple-touch-icon|manifest)"'`
   prints the tags of §2.1; or View Source on any page of the app.
2. **The picture.** Open `http://localhost:5176/og-image.png`: 1200 by 630, the dark ground, the red
   monogram, "RW-Rent", "Control at every turn."
3. **The picture's source and the one command.** Open `brand/og-image.html` in a browser: the same
   drawing. Then `node brand/make.cjs`, and `git status` shows nothing changed: the same bytes.
4. **The icons.**
   - The tab of any page shows the red monogram.
   - `http://localhost:5176/favicon.svg` and `/favicon.ico` open as the monogram.
   - `http://localhost:5176/apple-touch-icon.png` is the monogram on the dark ground, 180 by 180.
   - On an iPhone, once the app is deployed: Share, Add to Home Screen shows that icon and "RW-Rent".
5. **The manifest.** In the browser's tools, Application, Manifest: the name RW-Rent, the dark
   colours, three icons, no warning.
6. **The files answered as themselves.** For each of `og-image.png`, `favicon.svg`, `favicon.ico`,
   `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `site.webmanifest`, `robots.txt`:
   `curl -sI http://localhost:5176/<file>` answers 200 with the type of §4.2, not `text/html`.
7. **The same in the build.** `npx vite build --outDir /tmp/rwrent-build` puts the eight files beside
   `index.html`; `npx vite preview --outDir /tmp/rwrent-build --port 5175` answers them the same way.
8. **No search listing.** `curl -s http://localhost:5176/robots.txt` allows every robot, and the
   page's tags hold `robots` `noindex`.
9. **After deployment, on the live site,** which this run did not touch:
   - the same `curl -sI` for each file against `https://rw-rent.net/`, where Caddy answers them;
     look at the manifest's type there;
   - a link to `https://rw-rent.net` sent in a messenger shows "RW-Rent", the sentence and the
     picture. A messenger that showed the old preview keeps it for a while: Telegram's `@WebpageBot`,
     LinkedIn's Post Inspector and Facebook's Sharing Debugger read the page again.

### 5.2 F21-2 to F21-4

1. **Sign in**, `http://localhost:5176/sign-in`: under the heading, "Fleet and rental operations for
   RW-Rent." and nothing more; at the foot, "RW-Rent operations platform · v1.0.0"; the art's two
   lines as before.
2. **Create one, Forgot password?:** the same foot.
3. **A dead confirmation link**, `http://localhost:5176/confirm-registration-email#anything`: "This
   confirmation link cannot be used", its body, its fact and two buttons; no grey box with a code.
4. **A reset link's form**, `http://localhost:5176/reset-password#anything`: the note under the form
   reads "This link works once. It has been removed from this page's address." Type any address and a
   password of twelve characters or more and send: "This reset link cannot be used", with no code.
5. **A transfer link's form**, `http://localhost:5176/accept-administrator-transfer#anything`: the
   same note.
6. **Signed in, Profile:** its Sessions panel still says "Sessions end after two hours idle or twelve
   hours in total."

## 6. Decisions

Choices this run made where the specification left room, each small to change:

1. **The picture's composition:** the monogram and the name side by side, a short accent rule, the
   line under it, all centred, over the sign-in page's monogram pattern fading towards the middle.
2. **The name is set in Poppins 600,** which is what the sign-in page's wordmark is set in; the line
   in Michroma, as on that page.
3. **The tab's icon has no ground**, the red monogram alone, which reads on a light and on a dark
   tab; the home-screen and manifest icons stand on the dark ground, the monogram 56% of the square,
   so rounded corners cut none of it.
4. **`favicon.ico` holds PNGs** at 16, 32 and 48, which every browser that asks for the file reads.
5. **The manifest** gives the name, the short name, the description, the start address, the two
   colours and the icons, and no `display`: added to a home screen, the app opens in the browser as
   it does now.
6. **The picture's text** for those who cannot see it: "RW-Rent. Control at every turn."
7. **`brand/made.json`** and its test, so a picture and its source cannot drift apart unnoticed.
8. **The screen's line was removed, not hidden:** `Outcome` has no `meta`, `AuthOutcome` takes none,
   and the unused style is gone, so no later page can show a code there by passing one.

## 7. Deviations

1. **`robots.txt` refuses no robot.** §21 has it refuse every robot and says a messenger's preview
   works all the same. The two do not hold together: the robots of X, LinkedIn and Telegram obey
   `robots.txt`, and Facebook's mostly does, so a refusal of every robot would leave a link sent
   there without its name, sentence and picture; WhatsApp, iMessage and Slack do not read the file.
   Asked, the owner decided: "Let every robot in: robots.txt allows all, and the page keeps noindex.
   A search engine has to be able to read the page to see noindex; one that is refused can still
   list the bare address. So the preview works in every messenger and no search engine lists the
   app. Record it in your report as a change to §21; the reviewer corrects the specification
   afterwards." Built so: `User-agent: *`, `Allow: /`, and `noindex` in the page.

## 8. Open risks and observations

1. **The owner's apps on 5173 and 5174 hot-reloaded this code as it was saved,** each file swapped
   in whole after the suite passed in a scratch copy, the new files before the page that names them.
   Their pages now carry the tags and show the tab's icon; `index.html`'s change reloaded any open
   page once.
2. **What a messenger shows was not seen.** A messenger's robot cannot reach this Mac, and the live
   site carries the old page until the deployment agent deploys this. §5.1 step 9 is the look after
   that. Messengers keep a preview they have already made for some time.
3. **The preview is the same for every address of the app.** The tags stand in the one page a robot
   reads; a link to a driver or a rental previews as RW-Rent, not as that record, which a stranger
   could not open anyway.
4. **`noindex` is in the page, not in the files.** A search engine that reads the page lists
   nothing of it. The picture and the icons carry no such word themselves; a header on them would be
   Caddy's, the deployment's, if it is ever wanted.
5. **The theme colour is the dark ground** for everyone, also for a person who chose the light
   theme: the page names one colour before any script runs.
6. **The command needs the network and the testing folder's Chromium.** On another machine it needs
   Playwright from somewhere, named by `RWRENT_PLAYWRIGHT`. The pictures are committed, so nothing
   but changing a picture needs the command.
7. **Left for later, as §21 says:** the fonts and the icon font still come from Google's servers.

## 9. Commits

On `feature/backend-wiring`, after `6eac246`, in this order:

1. **`be37ced`** Wiring 53: A link to the app shows its name, a sentence and a picture, the app has its tab icon, home-screen icon, theme colour and manifest, and no search engine lists it: the page's tags, real files in public, and the pictures made from the pages in brand by one command.
   15 files: `README.md`; `index.html`; added `brand/icon.html`, `brand/made.json`, `brand/make.cjs`, `brand/og-image.html`; added `public/apple-touch-icon.png`, `public/favicon.ico`, `public/favicon.svg`, `public/icon-192.png`, `public/icon-512.png`, `public/og-image.png`, `public/robots.txt`, `public/site.webmanifest`; added `src/pages/followup21.preview.test.ts`.

2. **`c4ac55d`** Wiring 53: The public pages' foot and the sign-in page's introduction say nothing of sessions, no public message screen shows a technical line, and the note under a link's form speaks of the link.
   10 files (under `src/pages/`): `account/AcceptAdministratorTransfer.tsx`; `account/Auth.module.css`; `account/AuthLayout.tsx`; `account/ConfirmEmailChange.tsx`; `account/ConfirmRegistrationEmail.tsx`; `account/ResetPassword.tsx`; `account/SignIn.tsx`; `account/outcomes.test.ts`; `account/outcomes.ts`; added `followup21.public.render.test.ts`.

3. **This report's commit**, `Wiring 54`: `Context/wiring_report.md`, rewritten.
