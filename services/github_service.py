import os
import base64
import json
import requests

# TEMPORARY TEST ONLY — DO NOT COMMIT THESE VALUES
os.environ["GITHUB_TOKEN"] = "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"
os.environ["IMAGEKIT_PRIVATE_KEY"] = "private_CYRHDBDLYGDNY/Ejc/+ceyKVL+E="


GITHUB_OWNER = "adesh22-code"
GITHUB_REPO = "vibestay_seo"
GITHUB_FILE_PATH = "docs/data.json"
GITHUB_BRANCH = "main"


def get_github_headers():
    token = os.environ.get("GITHUB_TOKEN")

    if not token:
        raise RuntimeError("GITHUB_TOKEN is not set")

    return {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28"
    }


def get_file():

    url = (
        f"https://api.github.com/repos/"
        f"{GITHUB_OWNER}/{GITHUB_REPO}/contents/"
        f"{GITHUB_FILE_PATH}?ref={GITHUB_BRANCH}"
    )

    response = requests.get(
        url,
        headers=get_github_headers()
    )

    response.raise_for_status()

    github_file = response.json()

    content = base64.b64decode(
        github_file["content"]
    ).decode("utf-8")

    data = json.loads(content)

    return data, github_file["sha"]


def get_data():

    data, _ = get_file()

    return data


def update_data(data, sha):

    url = (
        f"https://api.github.com/repos/"
        f"{GITHUB_OWNER}/{GITHUB_REPO}/contents/"
        f"{GITHUB_FILE_PATH}"
    )

    content = json.dumps(
        data,
        indent=2,
        ensure_ascii=False
    )

    encoded_content = base64.b64encode(
        content.encode("utf-8")
    ).decode("utf-8")

    payload = {
        "message": "Update homestay data",
        "content": encoded_content,
        "sha": sha,
        "branch": GITHUB_BRANCH
    }

    response = requests.put(
        url,
        headers=get_github_headers(),
        json=payload
    )

    response.raise_for_status()

    return response.json()
