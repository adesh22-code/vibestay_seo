import os

from services.github_service import get_data
from services.static_site_service import rebuild_static_site

if __name__ == "__main__":
    data = get_data()
    print(f"Publishing {len(data)} homestay pages...")
    urls = rebuild_static_site(data)
    print(f"Published {len(urls)} pages plus sitemap.xml and robots.txt")
