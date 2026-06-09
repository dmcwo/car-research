# Car Research — Firefox Extension

> **Experimental Prototype.** This extension was built as a proof-of-concept to explore AI-assisted browser tooling for car shopping research. It is not a finished product. Extractors may break when car websites update their layouts, and the extension has not been exhaustively tested across every supported site. Use it as a starting point, not a polished tool.

A Firefox browser extension that captures, organizes, and exports car listing data while you shop. Visit any car listing page, the sidebar opens beside the page and immediately extracts the key data — review and edit it, then export as CSV or JSON for analysis in a spreadsheet or dedicated tool.

---

## Features

- **Sidebar panel** — opens beside the page (not overlaid), so the listing is always readable alongside the extracted data
- **Auto-extraction** — re-runs automatically when you navigate to a new listing or switch tabs; no button click needed
- **Extracts 30+ fields** — year, make, model, trim, condition, price, mileage, VIN, MPG/eMPG, fuel type, engine, drivetrain, transmission, colors, seller info, Carfax summary, CPO flag, warranty, and more
- **Controlled vocabulary** — Condition, Fuel Type, Body Style, and Seller Type use dropdowns; Make uses a typeahead input (type a few letters to filter from all known makes)
- **Editable fields** — review and correct anything the extractor missed before saving or exporting
- **Light and dark mode** — automatically follows your system preference
- **Export options**
  - **Copy CSV** — copies headers + values to clipboard (paste into Google Sheets or Excel)
  - **↓ CSV** / **↓ JSON** — downloads a file for this listing
  - **Save to Garage** — saves the listing locally for later bulk export
- **Garage** — persistent bottom drawer (always visible); save listings across sessions, then export everything at once

### Supported Sites (with dedicated extractors)

| Site | Extraction method |
|---|---|
| Carvana | DOM selectors with `__NEXT_DATA__` fallback |
| CarMax | DOM selectors with `__NEXT_DATA__` fallback |
| Cars.com | JSON-LD + DOM selectors |
| AutoTrader | JSON-LD + preloaded state |
| KBB | JSON-LD + CPO flag |
| Craigslist | DOM selectors (private sellers) |
| Any other site | Generic JSON-LD / Open Graph, then heuristic DOM parsing |

---

## Installing in Firefox (Temporary Load)

The extension is not published to the Firefox Add-ons store. To test it locally:

1. **Clone the repository**

   ```bash
   git clone https://github.com/dmcwo/car-research.git
   cd car-research
   ```

2. **Open Firefox** and navigate to:

   ```
   about:debugging#/runtime/this-firefox
   ```

3. Click **"Load Temporary Add-on…"**

4. Select **`manifest.json`** from your cloned folder

5. The Car Research icon appears in your toolbar. Click it to toggle the sidebar.

> **Note:** Temporary add-ons are removed when Firefox closes. Repeat steps 2–4 each session, or use the `web-ext` development method below.

---

## Installing for Development (with auto-reload)

1. Install dependencies:

   ```bash
   npm install
   ```

2. Run with auto-reload on file save:

   ```bash
   npm start
   ```

3. To lint:

   ```bash
   npm run lint
   ```

4. To rebuild `content/bundle-func.js` after editing any extractor source file:

   ```bash
   node scripts/bundle.js
   ```

---

## Using the Extension

### Capturing a listing

1. Navigate to a car listing on any supported site
2. Click the **Car Research** icon in the Firefox toolbar — the sidebar opens on the right side of the browser
3. The extension automatically extracts data from the current page; the status bar shows what was found
4. Review the extracted fields — edit anything that's wrong or missing
5. Use the action buttons:
   - **Copy CSV** — copies headers + values to clipboard
   - **↓ CSV** / **↓ JSON** — downloads a file for this listing
   - **Save to Garage** — saves the listing locally for later export

### Using the Garage

The **Garage** strip at the bottom of the sidebar shows how many cars you've saved. Click it to expand the garage drawer (the listing stays visible above it). The garage offers:
- **Export CSV / Export JSON** — download all saved listings at once
- **Clear All** — remove all saved cars
- **✕ per row** — delete an individual car

### Navigating between listings

The sidebar automatically re-extracts when you navigate to a new URL on the same tab or switch to a different tab. You don't need to click anything — just navigate and the data updates.

### Debugging

- **Sidebar JS errors**: Right-click anywhere in the sidebar → Inspect → Console
- **Content script errors**: Open the page's DevTools (F12) → Console
- **Reload after edits**: Go to `about:debugging` → find Car Research → click "Reload"

---

## Data Fields

| Field | Description |
|---|---|
| year, make, model, trim | Core vehicle identity |
| bodyStyle | Sedan / SUV / Truck / Hatchback / Coupe / Convertible / Wagon / Van / Minivan |
| condition | New / Used / CPO |
| engine | Engine description (e.g. "2.5L 4-cyl") |
| fuelType | Gasoline / Diesel / Hybrid / PHEV / Electric / Hydrogen |
| mpgCity, mpgHighway, mpgCombined | Fuel economy (handles MPGe for EVs) |
| drivetrain | FWD / AWD / RWD / 4WD |
| transmission | Automatic / Manual / CVT |
| price | Listing price (number) |
| mileage | Odometer reading |
| vin | 17-character VIN |
| stockNumber | Dealer stock number |
| colorExterior, colorInterior | Paint and interior color |
| owners | Number of previous owners |
| accidentCount | Reported accidents |
| carfaxSummary | Brief history report text |
| isCertifiedPreOwned | CPO flag (checkbox) |
| warrantyInfo | Warranty description |
| sellerName | Dealership or seller name |
| sellerType | Dealer / Private |
| sellerPhone, sellerLocation | Seller contact info |
| daysOnLot | Days the listing has been active |
| websiteName | Source website |
| url | Direct link to the listing |
| dateScraped | ISO timestamp when captured |
| notes | Your personal notes (editable) |

---

## Known Limitations

- **Extractors are fragile.** Site-specific extractors depend on the structure of each website's HTML or embedded JSON. When a site redesigns, the extractor may silently return partial data. Always review before exporting.
- **JavaScript-heavy pages.** Some listings load data asynchronously. If the sidebar opens before the page finishes loading, extraction may miss fields. Navigate away and back — the sidebar re-extracts automatically on return.
- **Carvana and CarMax.** Both sites appear to have moved away from exposing `__NEXT_DATA__` in the standard location. Extraction relies on DOM selectors, which may be less complete.
- **Colors and owner count.** These are often not present in the main listing DOM and may need to be filled in manually.
- **No Google Sheets sync yet.** Direct export to a designated Google Sheet is planned for a future version.

---

## Project Structure

```
car-research/
├── manifest.json                  # Extension manifest (MV3, Firefox)
├── background/
│   └── service-worker.js          # Storage message bus + toolbar button handler
├── content/
│   ├── bundle-func.js             # AUTO-GENERATED — do not edit directly
│   ├── extract.js                 # Dispatcher: selects and runs the right extractor
│   ├── extractors/
│   │   ├── carvana.js
│   │   ├── carmax.js
│   │   ├── cars-com.js
│   │   ├── autotrader.js
│   │   ├── kbb.js
│   │   ├── craigslist.js
│   │   ├── generic-jsonld.js      # Tier 2 fallback: JSON-LD / Open Graph
│   │   └── generic-heuristic.js  # Tier 3 fallback: regex + DOM heuristics
│   └── utils/
│       ├── dom-helpers.js
│       ├── price-parser.js
│       └── normalize.js
├── sidebar/
│   ├── sidebar.html               # Active UI (Firefox sidebarAction panel)
│   ├── sidebar.css                # Adaptive light/dark styles
│   └── sidebar.js                 # Sidebar controller
├── popup/
│   ├── export.js                  # CSV / JSON export utilities (shared with sidebar)
│   ├── garage.js                  # Garage rendering (shared with sidebar)
│   └── popup.*                    # Legacy popup files (not currently active)
├── shared/
│   ├── model.js                   # CarRecord data model + column order
│   └── constants.js               # Site → extractor name mapping
├── icons/
│   ├── lucide/                    # Locally hosted Lucide SVG icons
│   ├── icon-16.png
│   ├── icon-48.png
│   └── icon-128.png
└── scripts/
    ├── bundle.js                  # Concatenates extractor sources → bundle-func.js
    └── extract-body.js            # Extraction dispatcher body (input to build)
```

---

## Creation Record

### What this is

This extension was designed and built collaboratively using [Claude Code](https://claude.ai/code) (Anthropic's AI coding assistant), working from conversational descriptions of desired behavior and iterative user feedback on real listings. No starter template or boilerplate was used — the repository was empty at the start.

**Date:** June 7, 2026  
**Model:** claude-sonnet-4-6, via Claude Code on the web  
**Human:** Doug Worsham ([@dmcwo](https://github.com/dmcwo))

The project was built across multiple Claude Code sessions. Each session was a conversation: Doug described what he wanted, Claude planned the implementation, then built while Doug tested on real listings and reported what was working and what wasn't.

---

### Phase 1 — Architecture and initial build

Claude drafted a detailed implementation plan covering the data model (30+ fields), a tiered extraction architecture, and the full file structure. Doug reviewed and approved the plan before any code was written. The plan was preserved in Claude's plan mode file and is reflected in the commit history.

**What was specified:**
- User flow: visit a listing → activate extension → review extracted data → export as CSV/JSON
- Core fields: make, model, trim, year, price, mileage, MPG/eMPG, new/used, link, seller info
- Export targets: clipboard CSV, downloadable CSV/JSON; Google Sheets planned for v2

**What Claude contributed during design:**
- Tiered extraction (site-specific → JSON-LD → heuristic DOM) to balance accuracy and breadth
- Expanded the data model beyond the initial spec to cover powertrain, history, seller, and metadata
- Plain HTML/CSS/JS with no framework (extension loadable without any toolchain)
- `browser.storage.local` for the Garage (simpler and sufficient; no IndexedDB complexity)
- Prioritized extractors by volume: Carvana and CarMax first

---

### Phase 2 — Content script injection debugging

The initial implementation failed silently: content scripts were injected but returned no data. Over several test-and-fix cycles with Doug running the extension on real pages and reporting console errors, two root causes were found:

**Problem 1: Two `executeScript` calls don't share `window` state in Firefox MV3.**  
The first call injected all extractor scripts; the second tried to read `window.__carResearchResult`. Firefox isolates them, so the second call saw an empty window. Fixed by wrapping all extractor code in a single named function (`carResearchExtract`) bundled into `content/bundle-func.js`, passing the function reference directly as `func:` to a single `executeScript` call.

**Problem 2: Page CSP blocks `new Function()` even inside Firefox content scripts.**  
CarMax and Carvana both set strict `script-src` policies. An earlier approach that built a function dynamically from injected code strings was blocked by the sandbox (`call to Function() blocked by CSP`). The fix: define `carResearchExtract` as a real named function in the bundle, load it in `sidebar.html`, and pass it by reference. Firefox serializes and re-executes it in the page context, bypassing CSP entirely.

---

### Phase 3 — Extraction accuracy improvements

Doug tested on real CarMax and Carvana listings and reported specific inaccuracies:

| Problem | Root cause | Fix |
|---|---|---|
| Make/model missing | Heuristic used first non-empty h1/h2/title; CarMax SPAs have non-car h1 | Try all candidates; merge results |
| Trim "XLE Premium" instead of "L" | Trim dictionary searched full page body, matching similar-cars section at bottom | Limit scan to first 5,000 chars; prefer labeled patterns ("Trim: L") |
| Body Style "Truck" instead of "SUV" | Nav menu "Cars, Trucks, SUVs" matched "truck" first | Check "Sport Utility"/"SUV" before "pickup/crew cab" |
| Wrong mileage | First "X miles" in body text was a different number | Prefer labeled "Mileage: X,XXX" patterns; search `bodyHead` first |

---

### Phase 4 — Sidebar migration

The popup opened in the top-right corner of the browser, directly over the area where car sites display the listing's core info (make, model, price, mileage). Doug flagged this as a usability problem.

Claude evaluated three options — sidebar, injected in-page panel, smaller popup — and recommended Firefox's `sidebarAction` API, which pushes page content inward rather than overlaying it. The sidebar persists across navigation and auto-re-extracts when the user navigates to a new listing (`browser.tabs.onUpdated`) or switches tabs (`browser.tabs.onActivated`).

---

### Phase 5 — UI and UX overhaul

Several rounds of improvements based on Doug's feedback after seeing the extension in use:

**Visual design:**
- Light mode by default (was dark-only); dark mode via `prefers-color-scheme`
- Font sizes increased (14px body, 12px section headers, 11px field labels)
- Higher contrast; visible focus rings on inputs
- Lucide SVG icons (locally hosted) on action buttons, section headers, and garage strip
- Distinct icons: car (listing), warehouse (garage), user (seller section)

**Section structure:**
- Powertrain section dissolved into Vehicle (Engine, Fuel Type, MPG, Drivetrain, Transmission moved up)
- Listing section moved immediately after Vehicle
- Section collapse bars enlarged and given hover state and open/closed indicator
- Action buttons arranged 2×2 (was one row; icon + label didn't fit)

**Critical bug fix:**  
`overflow: hidden` on `<details>` elements inside Firefox flex containers clips the expanded content to the pre-open height. Removed it; applied border-radius directly to `<summary>` instead.

**Controlled vocabulary:**  
`<select>` dropdowns for Condition, Fuel Type, Body Style, Seller Type. `<datalist>` typeahead for Make.

**Garage redesign:**  
Converted from a tab (which fully replaced the listing view) to a persistent bottom drawer that expands/collapses in place. The listing is always visible above it. Also fixed the underlying dismiss bug: `display: flex` in CSS was overriding the `hidden` HTML attribute, so the garage panel never actually hid when switching back to the listing tab.

---

### Technical notes

- **No eval / dynamic code**: All extractor code is bundled at build time. The function is passed by reference, not constructed at runtime — compatible with strict CSP.
- **Lint status**: `web-ext lint` reports 0 errors, 0 warnings.
- **Branch workflow**: All development on `claude/dreamy-gates-QafdX`, merged to `main` via pull requests.
- **Session link**: [claude.ai/code/session_012LMfbsEve7RiSQLKRnxArg](https://claude.ai/code/session_012LMfbsEve7RiSQLKRnxArg)

---

## Roadmap

### Near-term
- Improve color and owner count extraction (currently missing on most sites)
- Better CarMax and Carvana field coverage
- Publish to Firefox Add-ons (AMO)

### Comparison and visualization layer
See the discussion in project issues. The current CSV/JSON export is designed as a clean handoff to a dedicated analysis tool.

### Future ideas
- Google Sheets integration (OAuth + Sheets API v4 append)
- Price history tracking (multiple snapshots per VIN)
- Reliability ratings and cost-of-ownership estimates
- Side-by-side comparison dashboard
