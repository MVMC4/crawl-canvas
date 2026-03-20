# Crawl Graph — Visual Web Crawler Explorer

A visual, interactive explorer for web crawl data. Run the bundled Python crawler against any site, then load the resulting JSON into the app to explore, annotate, filter, and audit your site's link structure as an interactive node graph.

---

## Table of Contents

- [The Crawler](#the-crawler)
- [Crawl Data Schema](#crawl-data-schema)
- [The App](#the-app)
- [Quick Start](#quick-start)

---

## The Crawler

`scripts/crawler.py` is a standalone Python script that crawls a website and outputs structured JSON. It's not just a link checker — it records **where** each URL was found in the HTML, giving you element-level context.

### Install & Run

```bash
pip install requests beautifulsoup4 lxml

# Basic usage
python scripts/crawler.py https://example.com

# Full options
python scripts/crawler.py https://example.com \
  --max 500 \
  --depth 4 \
  --delay 0.5 \
  --output my_site.json
```

### CLI Options

| Flag | Default | Description |
|---|---|---|
| `url` (positional) | — | Seed URL to start crawling |
| `--max` | 200 | Maximum number of URLs to crawl |
| `--depth` | 3 | Maximum link depth from the seed |
| `--delay` | 0.2 | Seconds between requests (be polite) |
| `--output` | `crawl_results.json` | Output file path |
| `--all-domains` | off | Follow links to external domains |
| `--ignore-robots` | off | Skip robots.txt checks |
| `--quiet` | off | Suppress per-URL console output |

### What It Tracks

| Feature | Detail |
|---|---|
| **Element tagging** | Records which HTML element (`<a>`, `<img>`, `<script>`, `<link>`, `<iframe>`, `<form>`, etc.) each URL came from |
| **URL chains** | Full breadcrumb path from the seed URL to every discovered URL |
| **Parent context** | The tag, `id`, and `class` of the parent element surrounding each link |
| **robots.txt** | Respected by default; skip with `--ignore-robots` |
| **Domain scoping** | Stays on the same domain by default; `--all-domains` to follow external links |
| **Asset tracking** | Images, scripts, and stylesheets are recorded but not crawled into |

---

## Crawl Data Schema

Each record in the output JSON contains:

```json
{
  "url": "https://example.com/about",
  "depth": 2,
  "status_code": 200,
  "content_type": "text/html",
  "page_title": "About Us",
  "outbound_links": 34,
  "error": null,

  "discovered_on": "https://example.com/",
  "url_chain": [
    "https://example.com/",
    "https://example.com/blog",
    "https://example.com/about"
  ],

  "source": {
    "tag": "a",
    "attribute": "href",
    "text": "About Us",
    "parent_tag": "nav",
    "parent_id": "main-nav",
    "parent_class": "navbar top-nav",
    "context_snippet": "<a href=\"/about\" class=\"nav-link\">About Us</a>"
  }
}
```

### Field Reference

**Identity**
- `url` — the crawled URL
- `depth` — how many link-hops from the seed (depth 0 = the seed URL itself)

**HTTP Response**
- `status_code` — HTTP status (200, 404, 500, etc.). Use this to find broken links
- `content_type` — MIME type (`text/html`, `image/png`, `application/javascript`, etc.). Use this to separate pages from assets
- `page_title` — the `<title>` text (HTML pages only)
- `outbound_links` — number of links found on this page
- `error` — connection/timeout/SSL error message, if the request failed

**URL Chain** (how the crawler reached this URL)
- `discovered_on` — the direct parent page where this URL was found
- `url_chain` — full ancestry path from seed → this URL. Useful for understanding why a page is at depth 4

**Source Element** (which HTML element contained the link — the unique part of this crawler)
- `source.tag` — the HTML element (`a`, `img`, `script`, `link`, `iframe`, `form`)
- `source.attribute` — which attribute held the URL (`href`, `src`, `action`)
- `source.text` — visible link text or `alt` attribute
- `source.parent_tag` — the parent element wrapping this link
- `source.parent_id` — parent element's `id` (e.g., `"main-nav"`)
- `source.parent_class` — parent element's CSS classes (e.g., `"navbar top-nav"`)
- `source.context_snippet` — short raw HTML snippet of the element

### Practical Queries

| Goal | Filter |
|---|---|
| Audit all images | `source.tag == "img"` |
| See only navigation links | `source.parent_id == "main-nav"` |
| Understand site depth | Group by `depth` |
| Find broken links | `status_code != 200` |
| Find most-linked-from pages | Sort by `outbound_links` descending |
| Find footer-only links | `source.parent_class` contains `"footer"` |

---

## The App

The app is a React + TypeScript SPA (Vite, Tailwind, ReactFlow) that visualizes crawl JSON as an interactive directed graph.

### Core Views

**Graph View** — the main canvas. Every crawled URL is a node, edges show parent→child discovery relationships. Nodes are color-coded by HTTP status:
- Purple — seed node (depth 0)
- Green — 2xx success
- Yellow — 3xx redirect
- Red — 4xx/5xx errors
- Gray — non-HTML assets

The graph supports pan, zoom, collapse/expand subtrees (double-click), and a minimap.

**Bookmarks View** — a separate canvas (toggle with the bottom dock or `Ctrl+B`) showing only your bookmarked nodes as draggable floating cards. Click a bookmark to open its info panel; use "Go to node" to jump back to the graph view centered on that node.

### Interactive Features

| Feature | How |
|---|---|
| **Select a node** | Click → opens the side panel with full metadata |
| **Collapse/expand subtrees** | Double-click a node |
| **Tooltip on hover** | Shows URL, content type, depth, and path |
| **Bookmark a node** | Click ☆ in the side panel |
| **Search** | Top bar search filters nodes by URL, title, nickname, or description |
| **Filter sidebar** | Filter by status code, content type, depth range, bookmarked/edited/error state |
| **Highlighted matches** | Filtered and searched nodes glow green in the graph and show green titles in the side panel |
| **Fly-to navigation** | Clicking a search result or "Discovered on" link flies the camera to that node |
| **Return to content** | Appears when you zoom out too far — click to fit the graph back in view |
| **Load deeper nodes** | Depth is capped at 2 by default; expand incrementally or load all |

### Side Panel (Node Inspector)

Three tabs when you select a node:

**Meta** — nickname, description, comments (all editable and auto-saved to localStorage), bookmark toggle, "Go to node" button, depth/type/outbound chips, and a link to the parent page.

**Data** — editable fields (page_title, status_code, outbound_links, error, source text/class/id) with edit indicators, plus read-only fields (url, depth, content_type, discovered_on, url_chain). Revert button to undo all edits.

**JSON** — raw JSON view of the record with copy button.

### Other Features

- **Project metadata modal** — name, description, audit notes, crawl date (persisted to localStorage)
- **Theme toggle** — dark/light mode
- **Layout direction** — toggle between top-down (TB) and left-right (LR) tree layout
- **Export JSON** — downloads the full dataset including your edits, bookmarks, and project metadata
- **Load new file** — drag or pick a different crawl JSON to replace current data
- **Sticky notes** — right-click the canvas to add floating notes (can be connected to nodes)
- **Cycle detection** — circular link references are detected and flagged
- **All edits persist** in localStorage — nicknames, descriptions, comments, field overrides, bookmarks, notes, project meta

---

## Quick Start

1. **Crawl a site:**
   ```bash
   pip install requests beautifulsoup4 lxml
   python scripts/crawler.py https://yoursite.com --output crawl.json
   ```

2. **Place or load the JSON:**
   - Drop `crawl.json` into `public/data/crawl.json` for auto-load, or
   - Use the "Load file" button in the app's top bar

3. **Explore:**
   - Pan and zoom the graph
   - Click nodes to inspect, edit, and annotate
   - Use filters and search to find specific pages
   - Bookmark important nodes for quick reference
   - Export your annotated dataset when done
