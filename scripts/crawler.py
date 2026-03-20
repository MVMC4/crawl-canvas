"""
Web Crawler with Element Tagging & URL Chain Tracking
======================================================
Tracks where each URL came from (which HTML element, attribute, text, and parent chain).

Install dependencies:
    pip install requests beautifulsoup4 lxml

Usage:
    python crawler.py https://example.com --max 100 --depth 3 --output results.json
"""

import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse, urldefrag
import json
import time
import argparse
from collections import deque
from dataclasses import dataclass, field, asdict
from typing import Optional
import sys

# ──────────────────────────────────────────────
# Data Structures
# ──────────────────────────────────────────────

@dataclass
class LinkSource:
    """Describes the HTML element a URL was found in."""
    tag: str                        # e.g. "a", "img", "script", "link"
    attribute: str                  # e.g. "href", "src", "action"
    text: str                       # visible text or alt text of the element
    parent_tag: str                 # immediate parent element tag
    parent_id: Optional[str]        # id of parent, if any
    parent_class: Optional[str]     # class of parent, if any
    context_snippet: str            # short surrounding HTML snippet


@dataclass
class CrawledURL:
    """Full record of a discovered URL."""
    url: str
    depth: int
    status_code: Optional[int]
    content_type: Optional[str]

    # Chain: how we got here
    discovered_on: Optional[str]    # the page this URL was found on
    url_chain: list                 # full path from seed → this URL

    # Element info
    source: Optional[LinkSource]

    # Page metadata (only for HTML pages)
    page_title: Optional[str] = None
    outbound_links: int = 0
    error: Optional[str] = None


# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; PyCrawler/1.0; +https://github.com/you/crawler)"
    )
}

LINK_ATTRIBUTES = {
    "a":          "href",
    "link":       "href",
    "area":       "href",
    "img":        "src",
    "script":     "src",
    "iframe":     "src",
    "source":     "src",
    "form":       "action",
    "blockquote": "cite",
    "q":          "cite",
    "ins":        "cite",
    "del":        "cite",
}


def normalize(url: str) -> str:
    """Strip fragment and trailing slash for deduplication."""
    url, _ = urldefrag(url)
    return url.rstrip("/")


def same_domain(url: str, base: str) -> bool:
    return urlparse(url).netloc == urlparse(base).netloc


def get_element_context(tag) -> str:
    """Return a short HTML snippet of the element for context."""
    snippet = str(tag)
    return snippet[:200] + ("..." if len(snippet) > 200 else "")


def extract_links(html: str, page_url: str):
    """
    Parse HTML and return a list of (absolute_url, LinkSource) tuples.
    Covers <a>, <img>, <script>, <link>, <iframe>, <form>, etc.
    """
    soup = BeautifulSoup(html, "lxml")
    found = []

    for tag_name, attr in LINK_ATTRIBUTES.items():
        for tag in soup.find_all(tag_name, **{attr: True}):
            raw = tag.get(attr, "").strip()
            if not raw or raw.startswith(("javascript:", "mailto:", "tel:", "data:", "#")):
                continue

            try:
                absolute = urljoin(page_url, raw)
                absolute = normalize(absolute)
            except Exception:
                continue

            if not absolute.startswith(("http://", "https://")):
                continue

            # Parent info
            parent = tag.parent
            parent_tag  = parent.name if parent else "unknown"
            parent_id   = parent.get("id") if parent else None
            parent_class = " ".join(parent.get("class", [])) if parent else None

            # Visible text / alt
            text = (tag.get_text(strip=True) or tag.get("alt") or tag.get("title") or "")[:100]

            source = LinkSource(
                tag=tag_name,
                attribute=attr,
                text=text,
                parent_tag=parent_tag,
                parent_id=parent_id,
                parent_class=parent_class,
                context_snippet=get_element_context(tag),
            )

            found.append((absolute, source))

    return found


def fetch(url: str, timeout: int = 10):
    """Fetch a URL, return (response | None, error_string | None)."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=timeout, allow_redirects=True)
        return resp, None
    except requests.exceptions.TooManyRedirects:
        return None, "Too many redirects"
    except requests.exceptions.SSLError as e:
        return None, f"SSL error: {e}"
    except requests.exceptions.ConnectionError as e:
        return None, f"Connection error: {e}"
    except requests.exceptions.Timeout:
        return None, "Timeout"
    except Exception as e:
        return None, str(e)


def check_robots(base_url: str) -> set:
    """Very basic robots.txt parser — returns disallowed paths for *."""
    disallowed = set()
    robots_url = urljoin(base_url, "/robots.txt")
    try:
        resp = requests.get(robots_url, headers=HEADERS, timeout=5)
        if not resp.ok:
            return disallowed
        ua_match = False
        for line in resp.text.splitlines():
            line = line.strip()
            if line.lower().startswith("user-agent:"):
                agent = line.split(":", 1)[1].strip().lower()
                ua_match = (agent == "*")
            elif ua_match and line.lower().startswith("disallow:"):
                path = line.split(":", 1)[1].strip()
                if path:
                    disallowed.add(path)
    except Exception:
        pass
    return disallowed


def is_allowed(url: str, disallowed_paths: set) -> bool:
    path = urlparse(url).path
    for dp in disallowed_paths:
        if path == dp or path.startswith(dp):
            return False
    return True


# ──────────────────────────────────────────────
# Crawler
# ──────────────────────────────────────────────

def crawl(
    seed_url: str,
    max_urls: int = 200,
    max_depth: int = 3,
    delay: float = 0.2,
    same_domain_only: bool = True,
    respect_robots: bool = True,
    output_file: str = "crawl_results.json",
    verbose: bool = True,
):
    seed_url = normalize(seed_url)
    disallowed = check_robots(seed_url) if respect_robots else set()

    # queue items: (url, depth, parent_url, url_chain, link_source)
    queue = deque()
    queue.append((seed_url, 0, None, [seed_url], None))

    visited = set()
    results = []

    print(f"\n🕷  Starting crawl: {seed_url}")
    print(f"   Max URLs: {max_urls} | Max Depth: {max_depth} | Delay: {delay}s\n")

    while queue and len(visited) < max_urls:
        url, depth, parent_url, chain, source = queue.popleft()
        url = normalize(url)

        if url in visited:
            continue
        if same_domain_only and not same_domain(url, seed_url):
            continue
        if not is_allowed(url, disallowed):
            if verbose:
                print(f"  ⛔ Blocked by robots.txt: {url}")
            continue

        visited.add(url)

        if verbose:
            indent = "  " * depth
            print(f"{indent}[{len(visited)}/{max_urls}] depth={depth} {url}")

        resp, error = fetch(url)

        record = CrawledURL(
            url=url,
            depth=depth,
            status_code=resp.status_code if resp else None,
            content_type=resp.headers.get("content-type", "") if resp else None,
            discovered_on=parent_url,
            url_chain=chain,
            source=source,
            error=error,
        )

        if resp and resp.ok:
            ct = resp.headers.get("content-type", "")
            if "text/html" in ct:
                soup = BeautifulSoup(resp.text, "lxml")
                title_tag = soup.find("title")
                record.page_title = title_tag.get_text(strip=True) if title_tag else None

                if depth < max_depth:
                    links = extract_links(resp.text, url)
                    record.outbound_links = len(links)

                    for child_url, child_source in links:
                        child_url = normalize(child_url)
                        if child_url not in visited:
                            new_chain = chain + [child_url]
                            queue.append((child_url, depth + 1, url, new_chain, child_source))

        results.append(record)

        if delay > 0:
            time.sleep(delay)

    # ── Save results ──
    output = []
    for r in results:
        d = asdict(r)
        output.append(d)

    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Done! Crawled {len(results)} URLs.")
    print(f"📄 Results saved to: {output_file}\n")

    # ── Summary ──
    errors   = [r for r in results if r.error]
    html_pages = [r for r in results if r.content_type and "text/html" in r.content_type]
    assets   = [r for r in results if r.content_type and "text/html" not in r.content_type]

    print("── Summary ──────────────────────────")
    print(f"  HTML pages : {len(html_pages)}")
    print(f"  Assets     : {len(assets)}")
    print(f"  Errors     : {len(errors)}")
    print(f"  Max depth  : {max([r.depth for r in results] or [0])}")
    print("─────────────────────────────────────\n")

    return results


# ──────────────────────────────────────────────
# CLI
# ──────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Web crawler with element tagging & URL chain tracking"
    )
    parser.add_argument("url",              help="Seed URL to start crawling")
    parser.add_argument("--max",            type=int,   default=200,               help="Max URLs to crawl (default: 200)")
    parser.add_argument("--depth",          type=int,   default=3,                 help="Max crawl depth (default: 3)")
    parser.add_argument("--delay",          type=float, default=0.2,               help="Delay between requests in seconds (default: 0.2)")
    parser.add_argument("--output",         type=str,   default="crawl_results.json", help="Output JSON file")
    parser.add_argument("--all-domains",    action="store_true",                   help="Follow links to other domains too")
    parser.add_argument("--ignore-robots",  action="store_true",                   help="Ignore robots.txt")
    parser.add_argument("--quiet",          action="store_true",                   help="Suppress per-URL output")

    args = parser.parse_args()

    crawl(
        seed_url=args.url,
        max_urls=args.max,
        max_depth=args.depth,
        delay=args.delay,
        same_domain_only=not args.all_domains,
        respect_robots=not args.ignore_robots,
        output_file=args.output,
        verbose=not args.quiet,
    )