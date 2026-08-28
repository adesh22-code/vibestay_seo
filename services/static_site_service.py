import os
import re
from html import escape
from urllib.parse import quote

import requests
from flask import render_template

from services.github_service import (
    GITHUB_BRANCH,
    GITHUB_OWNER,
    GITHUB_REPO,
    get_github_headers,
)

SITE_URL = os.environ.get("SITE_URL", "https://vibestay.store").rstrip("/")
STATIC_DIR = "docs"
HOMESTAY_DIR = f"{STATIC_DIR}/homestay"


def slugify(value):
    value = str(value or "").strip().lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = re.sub(r"-+", "-", value).strip("-")
    return value or "homestay"


def page_filename(homestay):
    hid = str(homestay.get("id", "")).strip()
    return f"{hid}-{slugify(homestay.get('name', 'homestay'))}.html"


def page_path(homestay):
    return f"{HOMESTAY_DIR}/{page_filename(homestay)}"


def page_url(homestay):
    return f"{SITE_URL}/homestay/{quote(page_filename(homestay))}"


def _seo_description(homestay):
    description = str(homestay.get("description") or "").strip().strip('"')
    location = str(homestay.get("location") or "Darjeeling").strip()
    name = str(homestay.get("name") or "Homestay").strip()
    text = f"{name} in {location}."
    if description:
        text += f" {description}"
    text += " View photos, amenities, location and contact details on VibeStay."
    return re.sub(r"\s+", " ", text)[:300]


def render_homestay_page(homestay):
    gallery = str(homestay.get("gallery") or "")
    gallery_images = [u.strip() for u in gallery.split("|") if u.strip()]
    if homestay.get("image") and homestay["image"] not in gallery_images:
        gallery_images.insert(0, homestay["image"])

    amenities = [x.strip() for x in str(homestay.get("amenities") or "").split(",") if x.strip()]
    price = str(homestay.get("price") or "").strip()
    formatted_price = f"₹ {price}" if price else "Price on Request"

    return render_template(
        "homestay_page.html",
        homestay=homestay,
        gallery_images=gallery_images,
        amenities=amenities,
        formatted_price=formatted_price,
        seo_description=_seo_description(homestay),
        canonical_url=page_url(homestay),
    )


def _github_file(path):
    url = f"https://api.github.com/repos/{GITHUB_OWNER}/{GITHUB_REPO}/contents/{path}?ref={GITHUB_BRANCH}"
    response = requests.get(url, headers=get_github_headers(), timeout=30)
    if response.status_code == 404:
        return None
    response.raise_for_status()
    return response.json()


def put_github_file(path, content, message):
    url = f"https://api.github.com/repos/{GITHUB_OWNER}/{GITHUB_REPO}/contents/{path}"
    existing = _github_file(path)
    import base64
    payload = {
        "message": message,
        "content": base64.b64encode(content.encode("utf-8")).decode("utf-8"),
        "branch": GITHUB_BRANCH,
    }
    if existing and existing.get("sha"):
        payload["sha"] = existing["sha"]
    response = requests.put(url, headers=get_github_headers(), json=payload, timeout=30)
    response.raise_for_status()
    return response.json()


def delete_github_file(path, message):
    existing = _github_file(path)
    if not existing:
        return False
    url = f"https://api.github.com/repos/{GITHUB_OWNER}/{GITHUB_REPO}/contents/{path}"
    payload = {
        "message": message,
        "sha": existing["sha"],
        "branch": GITHUB_BRANCH,
    }
    response = requests.delete(url, headers=get_github_headers(), json=payload, timeout=30)
    response.raise_for_status()
    return True


def publish_homestay(homestay):
    content = render_homestay_page(homestay)
    put_github_file(
        page_path(homestay),
        content,
        f"Publish homestay page: {homestay.get('name', homestay.get('id', ''))}",
    )
    return page_url(homestay)


def remove_homestay_page(homestay):
    return delete_github_file(
        page_path(homestay),
        f"Remove homestay page: {homestay.get('name', homestay.get('id', ''))}",
    )


def publish_sitemap(data):
    urls = [f"{SITE_URL}/index.html"]
    urls.extend(page_url(h) for h in data)

    body = ['<?xml version="1.0" encoding="UTF-8"?>',
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for url in urls:
        body.append(f"  <url><loc>{escape(url)}</loc></url>")
    body.append("</urlset>")

    put_github_file(
        f"{STATIC_DIR}/sitemap.xml",
        "\n".join(body) + "\n",
        "Update sitemap",
    )


def publish_robots():
    content = f"User-agent: *\nAllow: /\nSitemap: {SITE_URL}/sitemap.xml\n"
    put_github_file(
        f"{STATIC_DIR}/robots.txt",
        content,
        "Update robots.txt",
    )


def rebuild_static_site(data, delete_existing=False):
    """Publish every homestay page plus sitemap/robots.

    Existing generated pages are not removed unless delete_existing is requested.
    """
    published = []
    for homestay in data:
        published.append(publish_homestay(homestay))
    publish_sitemap(data)
    publish_robots()
    return published
