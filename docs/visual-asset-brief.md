# Visual asset brief: photos to make

This is every photo the site still needs, page by page. Each one has a generation prompt tuned to where and how it appears. Tick items off as you upload them.

**Already done in code, nothing for you to make:**
- **Icons.** About 80 hairline icons, from Lucide plus a few drawn for the site, are on the home page, Services, Sectors, Technology, Why Designo, Fit-out process, FAQ, Sustainability, Vastu, Referral, Contact and the cost estimator. Services and sectors without a photo show their icon on sage instead of a blank box.
- **Diagrams.** The Vastu grid (/vastu/), a "Where we work" coast map (/about/) and the payment-stages bar (/fit-out-process/).
- **Brand files.** The default social-share card (`static/assets/og-default.png`) and the iPhone home-screen icon (`static/assets/apple-touch-icon.png`).
- **Image spots for section C** exist already and stay hidden until you upload a photo.

---

## Before you start

**Never AI-generate anything that claims to be real.** That covers named client projects, Sanjeev, client logos and Designo's own offices. Those need real photos (section D). Generated images go only into illustrative spots: services, sectors, page banners and journal covers. Replace them with photos of your own installations over time.

**One shape for every landscape photo.** Generate at **16:9** and export **2400 × 1350**. The site crops the same file to 21:9 for banners and to 4:3 for cards and phones, and it moves photos slightly as you scroll. **Keep the main subject in the middle 60% of the width.** Nothing important should be near the left or right edge. Portrait photos are marked **4:5 (1600 × 2000)**.

**Export.** WebP, quality about 80, under 350 KB. Use the file names below. Upload through the admin (Pages CMS) into the field named, or send the files over and they'll be put in place.

### PHOTO STYLE: paste after every prompt

> Photorealistic architectural interior photograph for a premium Mumbai interior design firm. Eye-level camera (about 1.4 m), 24 mm tilt-shift lens, perfectly straight verticals, one- or two-point perspective. Soft natural daylight from large windows mixed with warm 3000K recessed downlights, gentle shadows, no blown highlights. Palette: warm white and stone (#F5F2ED) walls, light oak timber, pale terrazzo or warm-grey carpet, accents of deep forest green (#1E4D3B) and soft sage (#E6EDE8), small touches of brushed brass, living plants. Calm, uncluttered, real materials with fine texture; magazine colour grade that is slightly muted, warm and natural. Main subject centred with clear space at the left and right edges. No people, no text, no letters, no logos, no brand names, no watermark.

**Negative prompt** (Midjourney `--no`, Stable Diffusion): `text, lettering, signage, logo, watermark, people, faces, fisheye, curved verticals, warped furniture, extra chair legs, neon, oversaturated, HDR halo, plastic CGI look, clutter, blur, low resolution`

**Midjourney:** add `--ar 16:9 --style raw` (portraits: `--ar 4:5 --style raw`). **ChatGPT or Gemini:** write "wide 16:9 landscape" or "4:5 portrait" in the prompt.

---

## A. Do first: empty or broken spots (10 photos)

Each technology photo appears in 4 places: the /technology/ card, the /services/ card, the top of its own page, and the "Next system" card.

- [ ] **A1 · Networking & IT** · `media/services/networking-it.webp` · Admin › Services › Networking & IT infrastructure › Image
  > A small, immaculate server and network room inside a modern office. One black 42U network rack stands centre-frame with its door open: neatly dressed patch cables in white and forest green run through horizontal cable managers into patch panels and switches with tiny green status LEDs. White overhead cable tray, light-grey epoxy floor. Through a glass door at the right edge, a soft glimpse of the finished office in oak, plants and warm light. Precise and orderly.
- [ ] **A2 · CCTV** · `media/services/cctv-surveillance.webp` · Services › CCTV & video surveillance
  > Close, low-angle view of a small white dome IP camera on a smooth white gypsum ceiling at the corner of an office reception, sharp and slightly left of centre. Behind it, softly out of focus (f/2.8): a light-oak reception desk with a white stone top, a forest-green sofa, a tall plant, warm downlights. Discreet security that blends into a refined interior.
- [ ] **A3 · Access control** · `media/services/access-control.webp` · Services › Access control & visitor management
  > Entrance to an office floor: a frameless clear-glass door with a long brushed-steel pull handle. Beside it, a slim matte-black card and fingerprint reader on a light-oak wall panel, with a small green light glowing. A single hand (no face) holds a plain white access card about to tap. Through the glass, a softly blurred open office with oak desks, sage chairs and plants.
- [ ] **A4 · Fire alarm** · `media/services/fire-alarm.webp` · Services › Fire alarm & detection
  > A clean modern office corridor with a warm-white wall and an oak door. On the white ceiling are a round white smoke detector and a recessed sprinkler head beside a slim linear light. On the wall at shoulder height is a small red manual call point with no lettering. Sage carpet runner and a glass partition to a meeting room. Red is the only strong colour.
- [ ] **A5 · Office automation** · `media/services/office-automation.webp` · Services › Office automation & IoT
  > A meeting room at dusk with warm, dimmed lighting. In sharp focus is a slim wall touch panel with a dark glass screen showing a few glowing line symbols for light, blinds and temperature (no words), beside a brushed-brass switch plate on a warm-white wall. Behind: motorised blinds half lowered over full-height windows, Mumbai skyline lights blurred, an oak table and forest-green chairs.
- [ ] **A6 · Digital signage** · `media/services/digital-signage.webp` · Services › Digital signage & room booking
  > Corporate reception and lift lobby. A large portrait-format display sits flush in a light-oak vertical-slat feature wall, showing a soft abstract forest-green to sage gradient (no text). To one side is a glass meeting-room door with a small booking panel glowing green. Terrazzo floor, white stone counter, warm cove light, tall plant.
- [ ] **A7 · PA & background music** · `media/services/pa-background-music.webp` · Services › PA & background music
  > An empty office cafeteria and breakout space in bright midday light. There is a long oak communal table with sage chairs, a white stone coffee counter, pendants and plants. In the foreground of the oak-slat ceiling, two round flush white ceiling speakers are clearly visible but discreet.
- [ ] **A8 · Education** · `media/sectors/education.webp` · Admin › Sectors › Education › Image
  > A university seminar room in western India. Rows of light-oak tables with forest-green chairs face a blank white projection wall. The ceiling has acoustic panels and linear lights. Tall windows with white louvred shutters are part-open to coconut palms and laterite stone. Bright daylight on a polished stone floor. Durable, orderly, warm.
- [ ] **A9 · Fitness** · `media/sectors/fitness.webp` · Sectors › Fitness Centres
  > A premium fitness floor in Mumbai: black rubber flooring, a row of treadmills facing full-height windows with a morning city view, a light-oak wall with a full-height mirror, a black dumbbell rack, a sage accent wall, warm linear lights in a dark ceiling. Unbranded equipment. Calm and well organised.
- [ ] **A10 · Healthcare** (replaces the current low-resolution photo with "REGISTRATION" lettering) · `media/sectors/healthcare.webp` · Sectors › Healthcare
  > A calm clinic reception and waiting area: a curved light-oak counter with a seamless white solid-surface top, sage upholstered bench seating, a pale terrazzo floor, soft cove lighting, plants, and a short corridor to consultation rooms with frosted-glass doors. Bright, hygienic, reassuring. No signage.

## B. Next: give each page its own photo (9 photos, plus 5 optional)

Today one photo (the sunlit window-side office) appears on 5 pages, and the tropical conference room on 4. All four journal covers reuse project photos.

- [ ] **B1 · Sustainability banner** (also the home EcoVisions tile) · `media/site/sustainability.webp` · Settings › Site › Page images › EcoVisions
  > A green office breakout space. A living wall of tropical plants (pothos, ferns, philodendron) stands behind a long reclaimed-teak table with cane-backed chairs. Jute rug on terrazzo, terracotta planters, lime-plaster walls, large open windows with morning light streaming in. Fresh, healthy, quiet. Keep the lower-left third calm and slightly darker, because the headline sits there.
- [ ] **B2 · Vastu** (Vastu page and the home Vastu tile) · **4:5 portrait** · `media/site/vastu.webp` · Page images › Vastu
  > A sunlit corner cabin facing east in early morning. Low golden sun through tall windows casts long soft shadows on a pale terrazzo floor. On a solid light-oak desk sit a traditional circular brass Vastu compass and a rolled architectural drawing. Money plant in a terracotta pot, warm-white walls, one forest-green lounge chair. Serene and balanced. Put the desk in the lower half, with light and space above.
- [ ] **B3 · About banner** · `media/site/about.webp` · Page images › About banner
  > Inside an interior design studio: a long light-oak table covered with floor plans, a white-card scale model of an office floor, material boards (oak veneer, terrazzo, sage and forest-green fabric, brushed brass), pencils and a scale ruler. Windows behind with the Mumbai skyline softly blurred in warm afternoon light. Keep the activity in a horizontal band through the middle.
- [ ] **B4 · Technology banner** · `media/site/technology.webp` · Page images › Technology page banner
  > A boardroom at dusk with the technology built into the interior. A long oak table with flush pop-up connectivity boxes. A large dark display set into a vertical oak-slat wall, with a slim camera bar below it. A circular ceiling microphone array, concealed linear lighting, sage fabric acoustic panels, a glass wall to the office and city lights outside. Keep the key elements in the middle band.
- [ ] **B5 · Acoustics** (now reuses the studio photo) · `media/services/acoustics.webp` · Services › Acoustics & soundproofing
  > A private boardroom with serious acoustic treatment that still looks refined: walls of fabric-wrapped panels in sage and forest green, vertical light-oak slat baffles across the ceiling, a thick wool rug, an oak table with soft upholstered chairs, a double-glazed glass wall with a solid oak door. Hushed and focused.
- [ ] **B6 · Journal: low-VOC finishes** · `media/journal/low-voc-finishes/cover.webp` · Journal › post › Cover
  > Still life on a light-oak workbench by a window: open tins of matte paint in sage, stone and forest green with a wooden stirrer, painted sample cards fanned out, a brush, a lime-plaster sample and a sprig of leaves. Soft light from the left, shallow depth of field.
- [ ] **B7 · Journal: meeting-room technology** · `media/journal/meeting-room-technology/cover.webp`
  > A mid-sized meeting room ready for hybrid calls: a six-seat oak table, a large wall display (blank dark screen) with a slim camera bar beneath, a ceiling microphone, forest-green felt acoustic panels, a glass door with a frosted band, warm downlights. Seen from the doorway.
- [ ] **B8 · Journal: turnkey fit-out** · `media/journal/turnkey-fit-out/cover.webp`
  > An office floor mid fit-out, tidy and organised. Metal stud partitions are half-boarded with gypsum under an open ceiling grid with ducts and cable trays. Oak-veneer panels and boxed light fittings are stacked neatly. Drawings and a laptop lie on a trestle table in the foreground, with morning light from large windows. A safe, well-run site.
- [ ] **B9 · Journal: Vastu for offices** · `media/journal/vastu-for-offices/cover.webp`
  > Top-down view of an office floor-plan drawing on a light-oak table, with a traditional circular brass Vastu compass on it, a pencil, a scale ruler, a sheet of tracing paper overlapping the plan and a sprig of tulsi leaves. Soft light from the top left.
- [ ] *Optional* **B10–B14 · Area pages** (each now reuses a project photo) · `media/locations/<page>.webp` · Admin › Locations › Image
  - **kurla-kohinoor-city:** open-plan office high in a commercial tower, full-height windows over a dense Mumbai skyline and railway lines in hazy afternoon light.
  - **powai-eastern-suburbs:** office cabin overlooking a lake ringed by green hills and towers, morning light.
  - **western-suburbs:** reception lounge in a tower, distant Arabian Sea coastline at golden hour.
  - **navi-mumbai-thane:** meeting room with a view of green hills and a creek beyond mid-rise buildings, fresh monsoon light.
  - **goa:** boutique commercial interior with a laterite stone wall, white lime plaster, oak and cane furniture, terracotta tiles, louvred windows open to coconut palms.

## C. New spots on text-only pages (8 photos; the spots are already built)

Upload each one in **Settings › Site › Page images** under the field named. Until then the page shows nothing there.

- [ ] **C1 · Fit-out process banner** · 16:9 · `media/site/process.webp` · field *Fit-out process banner*
  > A wide view along an office floor during fit-out. The near half is finished (oak joinery, glass partitions, lights on) and the far half is in progress (metal studs, open ceiling grid with services). Materials stacked tidily, morning light, a safe and well-run site.
- [ ] **C2 · Working around your team** · 4:3 · `media/site/occupied.webp` · *Fit-out process — working around your team*
  > An open-plan office in daily use (laptops, mugs, plants on desks, nobody in frame). One corner is screened off behind a clean white floor-to-ceiling hoarding with a door, for works in progress. The working area stays tidy and undisturbed.
- [ ] **C3 · EcoVisions initiatives** (sits on dark green; uses the Vastu photo until set) · 4:3 · `media/site/sustainability-materials.webp` · *EcoVisions — our initiatives*
  > Close still life of sustainable materials on light oak: cork tiles, a bamboo board, jute and wool swatches, a recycled-glass terrazzo chip, a sage low-VOC paint card, a slim LED linear light. Soft side light, shallow depth of field, slightly darker background so it sits on deep green.
- [ ] **C4 · About: our style** · 4:3 · `media/site/about-style.webp` · *About — our style*
  > Where new meets old: refined light-oak joinery and a clear glass partition meet an original exposed concrete column and a restored heritage window in warm daylight.
- [ ] **C5 · About: our approach** · 4:3 · `media/site/about-approach.webp` · *About — our approach*
  > A design review laid out on a table, seen from above at an angle: printed 3D renders of an office, floor plans with pencil notes, material samples and two coffee cups. Collaborative and personal.
- [ ] **C6 · About: our network** · 4:3 · `media/site/about-network.webp` · *About — our network*
  > A craftsman's hands (no face) shaping a light-oak joint with a chisel in a joinery workshop, with wood shavings on the bench and warm side light.
- [ ] **C7 · Project brief page** · **4:5 portrait** · `media/site/brief.webp` · *Project brief page*
  > A floor-plan drawing and a bound tender document on a light-oak table, with a yellow tape measure, a laser distance meter and a pencil. Top-down at a slight angle.
- [ ] **C8 · Careers banner** (a real photo of your team is better) · 16:9 · `media/site/careers.webp` · *Careers banner*
  > A designer's desk in a bright studio: a monitor showing a 3D render of an office interior, a sketchbook of pencil sketches, material swatches, a scale ruler, a plant.

## D. Real photos only: do not generate

- [ ] **Founder portrait** · **4:5, 1600 × 2000** · `media/site/founder.webp` · Page images › Founder portrait. The About page shows an empty box until this is set. Sanjeev M. Haldankar, waist-up, in a finished Designo space or the office. Soft window light from one side, plain warm-white or oak background, relaxed expression, room above the head. A phone in portrait mode is fine if the light is good.
- [ ] **More project photos.** Recording Studio has 1 photo, Restaurant & Bar has 1 and Flagship Showroom has 2. Add 4 to 8 landscape photos each, shot like the PHOTO STYLE above.
- [ ] **Two missing client logos:** Hotel Centaur and S.S. Communication. SVG, or PNG with a transparent background, cropped tight (Admin › Clientele › Client logos).
- [ ] *Optional* **Office photos** of Bhandup West and Powai: the building entrance or your reception, 4:3, for the Contact page.
