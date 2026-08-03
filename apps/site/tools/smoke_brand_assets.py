from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

required_files = [
    "public/brand/site/logo-full.png",
    "public/brand/site/favicon.ico",
    "public/brand/site/favicon-16x16.png",
    "public/brand/site/favicon-32x32.png",
    "public/brand/site/apple-touch-icon.png",
    "public/brand/site/site-icon-192x192.png",
    "public/brand/site/site-icon-512x512.png",
    "src/components/Header.tsx",
    "src/components/Footer.tsx",
    "src/lib/site.ts",
    "src/lib/seo.ts",
    "app/layout.tsx",
    "public/manifest.webmanifest",
    "BRAND_ASSETS.md",
]

for relative in required_files:
    path = ROOT / relative
    if not path.is_file():
        raise RuntimeError(f"Missing official brand file: {relative}")

header = (ROOT / "src/components/Header.tsx").read_text(encoding="utf-8")
footer = (ROOT / "src/components/Footer.tsx").read_text(encoding="utf-8")
layout = (ROOT / "app/layout.tsx").read_text(encoding="utf-8")
seo = (ROOT / "src/lib/seo.ts").read_text(encoding="utf-8")
site = (ROOT / "src/lib/site.ts").read_text(encoding="utf-8")
manifest = json.loads((ROOT / "public/manifest.webmanifest").read_text(encoding="utf-8"))

required_markers = {
    "header full logo": "/brand/site/logo-full.png" in header,
    "footer full logo": "/brand/site/logo-full.png" in footer,
    "header next image": "import Image from 'next/image'" in header,
    "site favicon metadata": "/brand/site/favicon.ico" in layout,
    "site apple icon metadata": "/brand/site/apple-touch-icon.png" in layout,
    "schema robot logo": "/brand/site/site-icon-512x512.png" in seo,
    "approved Persian name": "persianName: 'قرص شمار'" in site,
    "approved Latin name": "englishName: 'BeshmarAI'" in site,
    "combined official name": "name: 'قرص شمار | BeshmarAI'" in site,
}

for label, passed in required_markers.items():
    if not passed:
        raise RuntimeError(f"Brand smoke marker failed: {label}")

if manifest.get("name") != "قرص شمار | BeshmarAI":
    raise RuntimeError("Manifest name is not the official brand name")

icons = manifest.get("icons") or []
icon_sources = {item.get("src") for item in icons}
if "/brand/site/site-icon-192x192.png" not in icon_sources:
    raise RuntimeError("Manifest 192px robot icon is missing")
if "/brand/site/site-icon-512x512.png" not in icon_sources:
    raise RuntimeError("Manifest 512px robot icon is missing")

if (ROOT / "public/icon.svg").exists():
    raise RuntimeError("Legacy generated icon.svg still exists")

all_text = "\n".join(
    path.read_text(encoding="utf-8", errors="replace")
    for base in [ROOT / "app", ROOT / "src", ROOT / "public"]
    for path in base.rglob("*")
    if path.is_file() and path.suffix in {".ts", ".tsx", ".json", ".webmanifest", ".txt"}
)

for forbidden in ["بشمارAI", "/icon.svg"]:
    if forbidden in all_text:
        raise RuntimeError(f"Legacy brand marker remains: {forbidden}")

for relative in required_files[:7]:
    data = (ROOT / relative).read_bytes()
    if len(data) < 100:
        raise RuntimeError(f"Brand asset is unexpectedly small: {relative}")

print("BESHMARAI_SITE_V5_OFFICIAL_BRAND_ASSETS_SMOKE_PASSED")
