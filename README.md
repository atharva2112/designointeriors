# Designo Interiors website

A fast static website with a free admin panel. No website-builder subscription.

| Piece | What it is | Cost |
| --- | --- | --- |
| Website | Plain HTML pages generated from the files in `content/` | — |
| Hosting | Cloudflare Pages | Free |
| Admin panel | Pages CMS — https://app.pagescms.org | Free |
| Content storage + backup | This GitHub repository | Free |
| Forms | Google Sheet + Apps Script (`apps-script/Code.gs`) | Free |
| WhatsApp alerts | CallMeBot (personal alerts) | Free |
| Domain | designointeriors.com, stays at GoDaddy | Your existing renewal |

## Folder map

```
content/            ← everything the admin panel edits (JSON)
  projects/         one file per project (optional case-study fields)
  services/         one file per service page (/services/…)
  locations/        one file per area page (/locations/…)
  journal/          one file per blog post
  jobs/             one file per opening
  clients.json      Clientele page
  sectors.json      the sectors, and the content of each sector page (/sectors/…)
  faqs.json         the FAQ page
  testimonials.json approved client quotes (empty until you add one)
  settings/site.json           phone, email, stats, brochures, images
  settings/estimator.json      ₹ per sq ft rates for the cost estimator
  settings/notifications.json  who gets alerted for each form
media/              photos and PDFs uploaded through the admin
static/             styles.css, site.js, fonts, logo and S-monogram files
build/build.js      turns content/ into the finished site in dist/
scripts/            publish-post.js (automated blog posts), import-remote-media.js
.github/workflows/  "Publish journal post" and "Import remote media" (run from the Actions tab)
preview/            a copy of the site with relative links that opens from disk (build with --preview, then copy dist/ here)
apps-script/Code.gs form handler for the Google Sheet
.pages.yml          admin panel configuration
```

## Design and motion

The site is built on the **Designo Interiors design system** (the brochure system): Cormorant Garamond Light for display lines and numerals, Inter for text, one green (`#2E745A`), deep-green grounds (`#1E4D3B`), hairline rules instead of boxes, square corners and no shadows. The fonts are self-hosted in `static/assets/fonts/`; colours and type live at the top of `static/styles.css`.

The brush-stroke **S** from the lockup is the monogram. `static/assets/s-mark.svg` is an exact trace of `s-mark-green.png`, and `build/build.js` (`S_PATH`) uses it for:

- the home cover, where the S is a window onto the showreel and scrolling walks through it to full screen
- the outline that draws itself at the top of every page, in the menu and behind the footer
- the back-to-top button, which fills with green as you read
- the separators in the client marquee

Other motion: headings rise line by line, photographs open upward and drift with a light parallax, rules draw themselves, stats count up, the practice statement inks in as you scroll, project cards show a "View" label beside the pointer, sector rows show a photo preview, and pages change with a short wipe in browsers that support view transitions.

Motion respects the visitor: with *reduce motion* switched on in their system settings, or without JavaScript, every page renders in its final, still state.

---

## One-time setup (about an hour)

### 1. GitHub
1. Create a free account at github.com (use designo371@gmail.com).
2. New repository → name it `designointeriors` → **Public** → Create.
3. Upload every file and folder in this package (drag them onto the repository page) → Commit.

> Public is needed for free approval rules (step 5). Nothing private is stored here: form submissions live in your Google Sheet, and WhatsApp keys live in Apps Script.

### 2. Cloudflare Pages (hosting)
1. Create a free account at dash.cloudflare.com.
2. Workers & Pages → Create → Pages → **Connect to Git** → choose `designointeriors`.
3. Build settings: Framework preset **None**, Build command `node build/build.js`, Build output directory `dist`.
4. Save and Deploy. Your site appears at `designointeriors.pages.dev` within a minute.

### 3. Admin panel (Pages CMS)
1. Go to https://app.pagescms.org → Sign in with GitHub → install the Pages CMS app on the `designointeriors` repository.
2. Open the repository. You'll see Projects, Services, Journal, Jobs, Clientele, Sectors, Locations, FAQ, Testimonials, Settings → Notifications, Settings → Cost estimator and Settings → Site in the sidebar.

### 4. Forms (Google Sheet)
1. Signed in as designo371@gmail.com, create a Google Sheet called **Designo enquiries**.
2. Extensions → Apps Script. Delete the sample code, paste in `apps-script/Code.gs`, Save.
3. Project Settings (gear) → Script properties → Add:
   - `SETTINGS_URL` = `https://designointeriors.com/settings/notifications.json` (use the `.pages.dev` address until the domain is connected)
4. Editor → choose `testSetup` → Run → allow the permissions. A test row appears in a “Quotes” tab and a test email arrives.
5. Deploy → New deployment → type **Web app** → Execute as **Me** → Who has access **Anyone** → Deploy. Copy the Web app URL.
6. In the admin: Settings → Site → **Forms web app URL** → paste → Save.

### 5. WhatsApp alerts (CallMeBot)
For each number that should get alerts (starting with 98201 11353):
1. Save **+34 644 51 95 23** in the phone's contacts.
2. From that phone, send this WhatsApp message to it: `I allow callmebot to send me messages`
3. CallMeBot replies with an API key.
4. In Apps Script → Project Settings → Script properties → Add `CALLMEBOT_919820111353` = the key.
5. In the admin, add the number under Settings → Notifications for the forms it should hear about.

> CallMeBot is a free personal service, not an official WhatsApp product. Email and the Sheet always work even if it's down.

### 6. Staff drafts, you approve
1. GitHub → repository → Branches → New branch `drafts`.
2. Settings → Branches → Add rule for `main`: tick **Require a pull request before merging** and **Require approvals (1)**.
3. Settings → Collaborators → invite each staff member (they need a free GitHub account).
4. Staff open the admin and switch the branch picker (top left) to **drafts** before editing. Cloudflare publishes drafts to a private preview address, e.g. `drafts.designointeriors.pages.dev`.
5. To approve: GitHub → Pull requests → New → `drafts` → `main` → review → **Merge**. The live site updates a minute later.

### 7. Bring the photos and brochures home
At launch, every photo and brochure in `content/` is still linked from the old GoDaddy site (`img1.wsimg.com`). Those links stop working when the Website Builder plan is cancelled, and Pages CMS can't preview or save an image field that points outside `media/`.

1. GitHub → repository → **Actions** → **Import remote media** → **Run workflow** (branch `main`).
2. About a minute later it commits every image and PDF into `media/` and updates the content to match. The run's summary lists anything it couldn't download; re-upload those by hand in the admin.

### 8. Connect the domain
1. Cloudflare Pages project → Custom domains → Set up → `designointeriors.com` (and `www`).
2. Cloudflare shows DNS records. In GoDaddy → My Products → Domain → DNS, add or replace them exactly as shown.
3. When the site loads on your domain **and step 7 has run**, cancel only the **GoDaddy Website Builder** plan. Keep the domain.

Old GoDaddy page addresses redirect to the new pages automatically (`_redirects` is generated by the build).

---

## Everyday tasks

**Add a project** — Admin → Projects → **Add an entry** → fill in Name, Sector, Client name, Area, Summary → upload Cover image and Photo gallery → switch on *Show on homepage* if wanted → **Save**. Live in about a minute.

**Edit or hide** — open the entry, change it, Save. Use *Hide from site* instead of deleting.

**Blog post** — Admin → Journal → Add an entry → title, category, date, cover, excerpt, body → Save. To publish from another tool instead, see *Automated blog posts* below.

**Client logos** — Admin → Clientele → *Client logos* → add an item → Client name → upload the Logo → Save. Use an SVG, or a PNG with a transparent background, cropped tight to the logo with no white margin. The site sizes logos automatically so a square mark and a long wordmark carry equal weight. Drag items to reorder. Only clients with a logo are shown, on the homepage and at the top of the Clientele page.

**Job opening** — Admin → Jobs → Add an entry. Tick *Hide (role filled)* when done.

**Case study** — open a project and fill in *Location*, *Year completed*, *Duration*, *Scope*, and *The challenge* / *Our approach* / *The outcome*. Each one appears on the project page only once it's filled in. *Location* also lists the project on the matching area page.

**Client quote** — Admin → Testimonials → add an item. Only publish quotes the client has approved. Quotes show on the homepage and the Why Designo page, and on a project page too if you enter its page address (e.g. `wincor-nixdorf`).

**Services, sectors and areas** — Admin → Services, Sectors or Locations. Every section on these pages (focus points, scope, clients, questions) is optional and is left out when empty. *Hide from site* on a sector removes it from every list, filter and form; Residential is hidden this way until it gets its own section.

**FAQ** — Admin → FAQ → add a question, pick a topic, Save.

**Cost estimator** — Admin → Settings → Cost estimator → enter *From* and *To* rates (₹ per sq ft) for each specification level → Save. The page (/fit-out-cost/) and its links appear only once at least one level has both rates. Add-ons without rates are left out.

**Change who gets alerts** — Admin → Settings → Notifications → pick the form → add or remove emails and WhatsApp numbers → Save. Changes apply within five minutes. New WhatsApp numbers also need their CallMeBot key (setup step 5).

**See submissions** — open the **Designo enquiries** Google Sheet. Each form has its own tab, newest at the bottom. Uploaded CVs, floor plans and RFPs are in Drive → *Designo website uploads*.

> The **Project brief** form (/project-brief/) is new. After updating `apps-script/Code.gs`, paste it into the Apps Script editor again and **Deploy → Manage deployments → Edit → New version**, so brief submissions get their own “Project briefs” tab. Without that they still arrive, in a tab named “brief”.

**Admin shows broken images, "Media folder not found" or "Path must start with the media directory"** — some content still links to an image on another site. Run setup step 7 again (Actions → Import remote media). It only touches links that are still remote.

### Photo guidelines
Landscape JPG or WebP, about 2400 px wide, under 1 MB if possible. Name files clearly (`wincor-nixdorf-01.jpg`). Up to 12 photos per project reads best.

### Limits worth knowing
- Gmail accounts can send about 100 alert emails a day. Plenty for enquiries; if you outgrow it, use a Google Workspace account.
- Uploaded CVs are limited to 5 MB; floor plans and RFPs on the project brief to 10 MB.
- Any single file on the site (photo, brochure PDF) must be under 25 MB, Cloudflare's limit. A bigger file is left out of the site with a warning in the build log, and its link stops working. Shrink PDFs with a free compressor such as ilovepdf.com/compress_pdf before uploading.
- The 9 projects, 4 journal posts and 4 jobs included at launch are placeholders. Edit them in the admin.

---

## Automated blog posts

The **Publish journal post** workflow (`.github/workflows/publish-post.yml`) adds a post without opening the admin. It accepts Markdown or HTML and downloads the cover and any images in the body into `media/`. It then builds the site to check nothing breaks before it commits. Posts land in the Journal exactly as if they had been typed into the admin, so they can be edited there afterwards.

**Where it publishes** — `"target": "drafts"` (the default) commits to the `drafts` branch, which Cloudflare shows on the preview address. You approve it with a pull request, as in setup step 6. `"target": "live"` commits straight to `main`. If `main` requires pull requests, only `drafts` works.

**By hand** — Actions → Publish journal post → Run workflow → fill in the form.

**From Zapier, Make, n8n, Apps Script or any script**

1. Create a token: GitHub → Settings → Developer settings → Fine-grained personal access tokens → Generate. Repository access: **Only select repositories → designointeriors**. Permissions → Repository → **Contents: Read and write**. Copy the token and keep it secret.
2. Send one request:

```
POST https://api.github.com/repos/atharva2112/designointeriors/dispatches
Authorization: Bearer <token>
Accept: application/vnd.github+json

{
  "event_type": "publish-post",
  "client_payload": {
    "title": "Five ways to shorten an office fit-out",
    "category": "Workplace",
    "body": "Markdown or HTML…",
    "excerpt": "Optional. One sentence; taken from the first paragraph if left out.",
    "cover": "Optional. https://… image link",
    "date": "Optional. 2026-10-16; today if left out",
    "target": "drafts"
  }
}
```

GitHub replies `204 No Content` straight away. The run itself, with any error, shows under Actions → Publish journal post.

| Field | Required | Notes |
| --- | --- | --- |
| `title` | yes | A heading at the top of the body that repeats the title is removed, since the page already shows it. |
| `category` | yes | Workplace, Vastu, Sustainability, Technology or News (any capitalisation). |
| `body` | yes | Markdown or HTML. Remote images are downloaded into `media/`; scripts are stripped. |
| `excerpt` | no | Taken from the first paragraph if left out. |
| `cover` | no | An `https://` image link (downloaded), or a `/media/…` path already in the repository. |
| `date` | no | `YYYY-MM-DD`; today (India time) if left out. |
| `slug` | no | Page address; made from the title if left out. |
| `target` | no | `drafts` (default) or `live`. |
| `replace` | no | `true` to overwrite a post that already has this address. Otherwise the run stops instead of overwriting. |

Google Apps Script example (store the token under Project Settings → Script properties as `GITHUB_TOKEN`):

```js
function publishPost(post) {
  var res = UrlFetchApp.fetch('https://api.github.com/repos/atharva2112/designointeriors/dispatches', {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN'), Accept: 'application/vnd.github+json' },
    payload: JSON.stringify({ event_type: 'publish-post', client_payload: post }),
    muteHttpExceptions: true
  });
  if (res.getResponseCode() !== 204) throw new Error(res.getContentText());
}
```
