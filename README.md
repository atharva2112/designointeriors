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
  projects/         one file per project
  journal/          one file per blog post
  jobs/             one file per opening
  clients.json      Clientele page
  sectors.json      the eight sectors
  settings/site.json           phone, email, stats, brochures, images
  settings/notifications.json  who gets alerted for each form
media/              photos and PDFs uploaded through the admin
static/             styles.css, site.js, fonts, logo and S-monogram files
build/build.js      turns content/ into the finished site in dist/
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
2. Open the repository. You'll see Projects, Journal, Jobs, Clientele, Sectors, Settings → Notifications and Settings → Site in the sidebar.

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

### 7. Connect the domain
1. Cloudflare Pages project → Custom domains → Set up → `designointeriors.com` (and `www`).
2. Cloudflare shows DNS records. In GoDaddy → My Products → Domain → DNS, add or replace them exactly as shown.
3. When the site loads on your domain, cancel only the **GoDaddy Website Builder** plan. Keep the domain.

Old GoDaddy page addresses redirect to the new pages automatically (`_redirects` is generated by the build).

---

## Everyday tasks

**Add a project** — Admin → Projects → **Add an entry** → fill in Name, Sector, Client name, Area, Summary → upload Cover image and Photo gallery → switch on *Show on homepage* if wanted → **Save**. Live in about a minute.

**Edit or hide** — open the entry, change it, Save. Use *Hide from site* instead of deleting.

**Blog post** — Admin → Journal → Add an entry → title, category, date, cover, excerpt, body → Save.

**Job opening** — Admin → Jobs → Add an entry. Tick *Hide (role filled)* when done.

**Change who gets alerts** — Admin → Settings → Notifications → pick the form → add or remove emails and WhatsApp numbers → Save. Changes apply within five minutes. New WhatsApp numbers also need their CallMeBot key (setup step 5).

**See submissions** — open the **Designo enquiries** Google Sheet. Each form has its own tab, newest at the bottom. Uploaded CVs are in Drive → *Designo website uploads*.

### Photo guidelines
Landscape JPG or WebP, about 2400 px wide, under 1 MB if possible. Name files clearly (`wincor-nixdorf-01.jpg`). Up to 12 photos per project reads best.

### Limits worth knowing
- Gmail accounts can send about 100 alert emails a day. Plenty for enquiries; if you outgrow it, use a Google Workspace account.
- Uploaded CVs are limited to 5 MB.
- The 9 projects, 4 journal posts and 4 jobs included at launch are placeholders. Edit them in the admin.
