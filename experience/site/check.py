"""AI Summit Mini-Hack check: is this project published, shared with Alex, and submitted?

  python3 ~/hackathon/check.py --time    minutes left (the first run starts the 90-minute clock)
  python3 ~/hackathon/check.py --early   after Step 4: created, published, shared with Alex
  python3 ~/hackathon/check.py           Step 9: all of that, plus submitted

It shares the site with Alex again each time (that's safe to repeat), so a share that
failed earlier is fixed here. Each problem is one line saying how to fix it.
"""

import json
import os
import re
import subprocess
import sys
import time

ALEX_NPUB = "npub198kxhz0qyey9a3ufukkkz8swdqx4huf3lcn2tz3kwkt5ytne9ezskfayjc"
ALEX = "alexlwn@finite.vip"
REQUIRED_FIELDS = ("title", "pitch", "person")
APP = os.path.expanduser("~/hackathon/app")
DEADLINE = os.path.expanduser("~/hackathon/deadline")
BUILD_MINUTES = 90
SUBMIT_BY_MINUTES = 15


def run(args, cwd):
    try:
        done = subprocess.run(args, cwd=cwd, capture_output=True, text=True, timeout=90)
    except (OSError, subprocess.TimeoutExpired) as error:
        return None, str(error)
    return done, (done.stdout + done.stderr).strip()


def fsite(args, cwd):
    """Runs fsite with JSON output: (answer or None, error text)."""
    done, out = run(["fsite", *args, "--output", "json"], cwd)
    if done is None or done.returncode != 0:
        return None, (out or "no output").splitlines()[-1][:300]
    try:
        return json.loads(done.stdout), ""
    except ValueError:
        return None, f"not JSON: {out[:200]}"


def read_config(app):
    path = os.path.join(app, "finite.toml")
    if not os.path.isfile(path):
        return None
    with open(path) as handle:
        text = handle.read()
    found = {key: re.search(rf'^\s*{key}\s*=\s*"([^"]+)"', text, re.MULTILINE) for key in ("slug", "name", "path")}
    return {key: match.group(1) if match else None for key, match in found.items()}


def read_hack(app):
    path = os.path.join(app, "hack.json")
    if not os.path.isfile(path):
        return None, "hack.json is missing: write it as Step 4 shows, then push."
    try:
        with open(path) as handle:
            return json.load(handle), None
    except ValueError as error:
        return None, f"hack.json is not valid JSON ({error}): fix it, then push."


def slides_dir(slides):
    """'/slides/', 'slides', or 'slides/index.html' -> 'slides'; None or 'null' -> None."""
    text = str(slides or "").strip().strip("/")
    if text in ("", "null", "none", "None"):
        return None
    return text[: -len("/index.html")] if text.endswith("/index.html") else text


def check_submission(app, hack, site_path):
    problems = []
    for field in REQUIRED_FIELDS:
        if not str(hack.get(field) or "").strip():
            problems.append(f'hack.json has no "{field}": fill it in, then push.')
    if hack.get("status") != "ready":
        problems.append('hack.json "status" is not "ready": set it (Step 9), then push.')
    if not hack.get("submittedAt"):
        problems.append('hack.json has no "submittedAt": set it to the output of date -u +%Y-%m-%dT%H:%M:%SZ, then push.')
    slides = slides_dir(hack.get("slides"))
    if slides and not os.path.isfile(os.path.join(app, site_path, slides, "index.html")):
        problems.append(f'hack.json says there are slides, but {site_path}/{slides}/index.html is missing: '
                        'add them, or set "slides": null. Then push.')
    return problems


def check_git(app):
    done, out = run(["git", "status", "--porcelain"], app)
    if done is None or done.returncode != 0:
        return [f"{app} is not a git repository: do Step 4."]
    problems = []
    if out:
        problems.append("Some changes are not pushed: git add -A && git commit -m Update && git push")
    run(["git", "fetch", "-q", "origin", "main"], app)
    remote, _ = run(["git", "rev-parse", "origin/main"], app)
    if remote is None or remote.returncode != 0:
        return problems + ["Nothing is pushed yet: git push -u origin main"]
    counts, _ = run(["git", "rev-list", "--left-right", "--count", "HEAD...origin/main"], app)
    ahead, behind = (int(n) for n in counts.stdout.split()) if counts and counts.returncode == 0 else (1, 0)
    if behind:
        problems.append(f"Teammates pushed {behind} commit(s) you don't have: git pull --rebase, then git push "
                        "(never --force).")
    elif ahead:
        problems.append("Your latest commit is not pushed: git push origin main")
    return problems


def check_site(app, config):
    slug = config["slug"]
    status, error = fsite(["project", "status", slug], app)
    if status is None:
        return [f"fsite project status {slug} failed ({error}). Run fsite auth register --output json, then this "
                "check again. If it still fails, tell your person, and tell Alex at the event."], None
    site = status.get("site") or {}
    problems = []
    if site.get("name") != (config["name"] or slug) or site.get("path") != config["path"]:
        problems.append(f'finite.toml no longer matches the site (name "{site.get("name")}", path "{site.get("path")}"), '
                        "so pushes don't publish: put those values back in finite.toml, commit, and push.")
    if site.get("status") != "published" or not site.get("active_version"):
        problems.append(f"The site is not published yet (status {site.get('status')!r}): push to main, wait a minute, run this again.")
    if ALEX_NPUB not in {person.get("npub") for person in status.get("collaborators") or []}:
        _, error = fsite(["project", "grant", slug, "--nip05", ALEX, "--role", "editor"], app)
        if error:
            problems.append(f"Couldn't add Alex to the project ({error}): fsite project grant {slug} --nip05 {ALEX} --role editor --output json")
    shared, error = fsite(["project", "share", slug, "--add-nip05", ALEX, "--add-email", ALEX], app)
    if shared is None or ALEX_NPUB not in (shared.get("shared_npubs") or []):
        problems.append(f"Couldn't share the site with Alex ({error or 'he is not in shared_npubs'}): "
                        f"fsite project share {slug} --add-nip05 {ALEX} --add-email {ALEX} --output json")
    return problems, site.get("url")


def minutes_left():
    """Starts the clock on first use. Alex calling time sooner: write the new epoch to ~/hackathon/deadline."""
    if not os.path.isfile(DEADLINE):
        os.makedirs(os.path.dirname(DEADLINE), exist_ok=True)
        with open(DEADLINE, "w") as handle:
            handle.write(str(int(time.time()) + BUILD_MINUTES * 60))
    with open(DEADLINE) as handle:
        deadline = int(handle.read().strip())
    left = max(0, round((deadline - time.time()) / 60))
    print(f"{left} min left (deadline {time.strftime('%H:%M', time.localtime(deadline))}).")
    if left <= SUBMIT_BY_MINUTES:
        print("Almost time: make sure you've submitted. If Step 9 isn't ticked in STATE.md, do it now, before anything else.")
    return 0


def main():
    if "--time" in sys.argv:
        return minutes_left()
    early = "--early" in sys.argv
    paths = [arg for arg in sys.argv[1:] if not arg.startswith("--")]
    app = os.path.expanduser(paths[0]) if paths else APP
    config = read_config(app) if os.path.isdir(app) else None
    if not config or not config["slug"]:
        print(f'FIX: {app}/finite.toml is missing or has no slug = "...". Do Step 4 of the playbook.')
        return 1
    site_path = config["path"] or "site"
    problems = []
    if not os.path.isfile(os.path.join(app, site_path, "index.html")):
        problems.append(f"{site_path}/index.html is missing: the site has no home page.")
    hack, hack_problem = read_hack(app)
    if hack_problem:
        problems.append(hack_problem)
    elif not early:
        problems += check_submission(app, hack, site_path)
    problems += check_git(app)
    site_problems, url = check_site(app, config)
    problems += site_problems
    for problem in problems:
        print(f"FIX: {problem}")
    if problems:
        print(f"\n{len(problems)} to fix. Fix them, then run this check again.")
        return 1
    print(f"Site: {url}")
    slides = slides_dir((hack or {}).get("slides"))
    if slides and url and not early:
        print(f"Slides: {url.rstrip('/')}/{slides}/")
    if early:
        print("ALL GOOD so far: the site is live and Alex can see it. Tick Step 4.")
    else:
        print("ALL GOOD: Alex has your project on the presentation list.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
