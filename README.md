# Car Research — Firefox Extension

> **Experimental Prototype.** This extension was built as a proof-of-concept to explore AI-assisted browser tooling for car shopping research. It is not a finished product. Extractors may break when car websites update their layouts, and the extension has not been tested across every supported site. Use it as a starting point, not a polished tool.

A Firefox browser extension that helps you capture, compare, and export car listing data while you shop. Visit any car listing page, click the extension icon, review the extracted data, and export it as CSV or JSON for use in a spreadsheet.

---

## Features

- **Extracts key listing data** — year, make, model, trim, price, mileage, VIN, MPG, fuel type, drivetrain, colors, seller info, Carfax summary, and more
- **Editable fields** — review and correct anything the extractor missed before exporting
- **Copy as CSV** — one click copies a formatted row to your clipboard for pasting directly into Google Sheets or Excel
- **Download CSV or JSON** — save individual listings or your full garage as structured files
- **Garage** — save listings locally across sessions; export everything at once when you're ready to compare

### Supported Sites (with dedicated extractors)

| Site | Extraction method |
|---|---|
| Carvana | `__NEXT_DATA__` JSON blob |
| CarMax | `__NEXT_DATA__` JSON blob |
| Cars.com | JSON-LD + DOM selectors |
| AutoTrader | JSON-LD + preloaded state |
| KBB | JSON-LD + CPO flag |
| Craigslist | DOM selectors (private sellers) |
| Any other site | Generic JSON-LD / Open Graph fallback, then heuristic DOM parsing |

---

## Installing in Firefox (Temporary Load)

The extension is not yet published to the Firefox Add-ons store. To test it locally:

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

4. In the file picker, navigate to your cloned `car-research` folder and select **`manifest.json`**

5. The Car Research extension will appear in your toolbar. It stays loaded until Firefox is closed.

> **Note:** Temporary add-ons are removed when Firefox closes. Repeat steps 2–4 each session, or use the `web-ext` method below for a smoother development experience.

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

   This uses `web-ext run` to launch a Firefox instance with the extension loaded. Changes to source files reload the extension automatically.

3. To lint the extension:

   ```bash
   npm run lint
   ```

---

## Testing the Extension

### Basic flow

1. Navigate to a car listing on any supported site (e.g. a Carvana or Craigslist listing)
2. Click the **Car Research** icon in the Firefox toolbar
3. The popup opens and immediately attempts to extract data from the page
4. Review the extracted fields — edit anything that's wrong or missing
5. Use the action buttons at the bottom:
   - **Copy CSV** — copies headers + values to clipboard (paste into Google Sheets)
   - **↓ CSV** — downloads a `.csv` file for this listing
   - **↓ JSON** — downloads a `.json` file for this listing
   - **Save to Garage** — saves the listing locally for later

### Testing the Garage

1. Save a few listings using "Save to Garage"
2. Click the **Garage** tab in the popup to see all saved cars
3. Use **Export CSV** or **Export JSON** to download all saved listings at once
4. Individual cars can be deleted with the ✕ button

### Testing on an unsupported site

Visit any dealer website not in the supported list above. The extension will fall back to generic JSON-LD parsing and heuristic DOM scanning — you'll likely get partial data (URL, maybe price and year/make/model). Fill in the rest manually before exporting.

### Debugging

- **Popup JS errors**: Right-click the extension popup → Inspect → Console
- **Content script errors**: Open the page's DevTools (F12) → Debugger → look under "Content Scripts"
- **Reload after edits**: Go to `about:debugging` → find Car Research → click "Reload"

---

## Data Fields Captured

| Field | Description |
|---|---|
| year, make, model, trim | Core vehicle identity |
| bodyStyle | Sedan, SUV, Truck, etc. |
| condition | New / Used / CPO |
| price | Listing price (number, no $ symbol) |
| mileage | Odometer reading |
| vin | 17-character VIN |
| stockNumber | Dealer stock number |
| fuelType | Gasoline / Electric / Hybrid / PHEV / Diesel |
| mpgCity, mpgHighway, mpgCombined | Fuel economy |
| engine | Engine description |
| drivetrain | FWD / AWD / RWD / 4WD |
| transmission | Automatic / Manual / CVT |
| colorExterior, colorInterior | Paint and interior color |
| owners | Number of previous owners |
| accidentCount | Number of reported accidents |
| carfaxSummary | Brief Carfax/history text |
| isCertifiedPreOwned | CPO flag |
| warrantyInfo | Warranty description |
| sellerName | Dealership or seller name |
| sellerType | Dealer or Private |
| sellerPhone, sellerLocation | Seller contact info |
| daysOnLot | Days listed |
| websiteName | Source website |
| url | Direct link to the listing |
| dateScraped | ISO timestamp when captured |
| notes | Your personal notes (editable) |

---

## Known Limitations

- **Extractors are fragile.** Site-specific extractors depend on the structure of each website's HTML or embedded JSON. When a site redesigns or restructures its data, the extractor may silently return empty fields. Always review extracted data before exporting.
- **JavaScript-heavy pages.** Some listings load data asynchronously. If the popup opens before the page finishes loading, extraction may be incomplete. Close the popup, wait for the page to fully load, and try again.
- **Craigslist regional subdomains.** The Craigslist extractor handles all `*.craigslist.org` subdomains but listing HTML varies slightly by region.
- **No Google Sheets sync yet.** Direct export to a designated Google Sheet is planned for a future version.
- **Mileage on new cars.** New car listings typically show 0 or no mileage; this is expected.

---

## Project Structure

```
car-research/
├── manifest.json                  # Extension manifest (MV3)
├── background/
│   └── service-worker.js          # Storage message bus
├── content/
│   ├── extract.js                 # Dispatcher: selects and runs the right extractor
│   ├── extractors/
│   │   ├── carvana.js
│   │   ├── carmax.js
│   │   ├── cars-com.js
│   │   ├── autotrader.js
│   │   ├── kbb.js
│   │   ├── craigslist.js
│   │   ├── generic-jsonld.js      # Fallback: JSON-LD / Open Graph
│   │   └── generic-heuristic.js  # Fallback: regex + DOM patterns
│   └── utils/
│       ├── dom-helpers.js
│       ├── price-parser.js
│       └── normalize.js
├── popup/
│   ├── popup.html
│   ├── popup.css
│   ├── popup.js                   # Main popup controller
│   ├── garage.js                  # Garage tab
│   └── export.js                  # CSV / JSON export
└── shared/
    ├── model.js                   # CarRecord data model
    └── constants.js               # Site → extractor mapping
```

---

## Creation Record

**What this is:** This extension was designed and built in a single session using [Claude Code](https://claude.ai/code) (Anthropic's AI coding assistant), working from a conversational description of the desired user flow. No starter template or boilerplate was used — the repository was empty at the start of the session.

**Date:** June 7, 2026

**Model:** Claude (claude-sonnet-4-6), via Claude Code on the web

**Human role:** Doug Worsham provided the product concept, user flow, and feedback on the plan before implementation began. The session used plan mode — Claude drafted a detailed implementation plan, which was reviewed and approved before any code was written.

**What was specified up front:**
- User visits a car website, activates the extension, reviews extracted data, and exports as CSV/JSON
- Fields to capture: make, model, trim, year, price, mileage, MPG/eMPG, new/used, link, seller/website name
- Export targets: copy-paste CSV, downloadable CSV, downloadable JSON
- Google Sheets integration flagged as a future version

**What Claude contributed during design:**
- Recommended a tiered extraction architecture (site-specific → JSON-LD → heuristic DOM) to balance accuracy and breadth
- Expanded the data model to 30+ fields covering powertrain, history, seller, and metadata
- Chose plain HTML/CSS/JS with no build step to keep the extension loadable without any toolchain
- Selected `browser.storage.local` over IndexedDB for the Garage (simpler, sufficient for hundreds of records)
- Designed the Garage tab as a second panel in the popup for cross-session persistence
- Prioritized extractor sites by volume: Carvana and CarMax first (both use `__NEXT_DATA__` JSON), then Cars.com, AutoTrader, KBB, Craigslist

**Implementation:** All 27 source files were written by Claude in sequence, then linted with `web-ext lint` (result: 0 errors, 0 warnings). One `innerHTML` security warning was caught by the linter and fixed before the final commit.

**Limitations of this approach:** The extractors are best-effort pattern matches against live websites. They have not been tested against real listings — only designed based on known patterns for each site. Some will likely need adjustment once tested against actual pages. This is expected for a prototype of this kind.

**Session link:** [claude.ai/code](https://claude.ai/code/session_012LMfbsEve7RiSQLKRnxArg)

---

## Future Ideas

- Google Sheets integration (OAuth + Sheets API v4 append)
- Auto-detect when you navigate to a new listing and pre-load data
- Price history tracking (save multiple snapshots of the same VIN)
- Side-by-side comparison view within the Garage
- Publish to Firefox Add-ons (AMO) with proper signing
