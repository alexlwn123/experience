"""AI Summit Mini-Hack check: is the app live, shared with Alex, on his board, and submitted?

  python3 ~/hackathon/check.py --time    minutes left (the first run starts the 90-minute clock)
  python3 ~/hackathon/check.py --early   after Step 4: the app is live, Alex is invited, its link is on the board
  python3 ~/hackathon/check.py           Step 9: all of that, plus submitted
  python3 ~/hackathon/check.py --add-teammate EMAIL   give a teammate edit access, and print the line for them

It finds the app from the folder `fragment sync` keeps under ~/hackathon (or pass the folder).
It invites Alex again when he is neither in nor invited, and puts the app's link on the
board when it is missing (both safe to repeat), so a step that failed earlier is fixed here.
Each problem is one line saying how to fix it.
"""

import glob
import json
import os
import re
import subprocess
import sys
import time

ALEX = "alexlwn@finite.vip"
ALEX_NPUB = "npub1guf7xyk25g96xrrtasg87easwa3aw9u296rjgfheae82dezq65qqmuj5u5"
BOARD = "mini-hack--hack"
SITE = "https://mini-hack.finite.place"
HACKATHON = os.path.expanduser("~/hackathon")
DEADLINE = os.path.join(HACKATHON, "deadline")
BUILD_MINUTES = 90
SUBMIT_BY_MINUTES = 15
EMAIL = re.compile(r"[^@\s]+@[^@\s]+\.[^@\s]+")


def fragment(*args):
    """Runs the fragment CLI with JSON output: (data or None, error text)."""
    try:
        done = subprocess.run(["fragment", *args, "--json"], capture_output=True, text=True, timeout=120)
    except FileNotFoundError:
        return None, "the fragment CLI isn't installed (see https://finite.chat/llms.txt)"
    except subprocess.TimeoutExpired:
        return None, "fragment took too long to answer; try again"
    lines = [line for line in done.stdout.splitlines() if line.strip().startswith("{")]
    try:
        answer = json.loads(lines[-1]) if lines else {}
    except ValueError:
        answer = {}
    if answer.get("ok"):
        data = answer.get("data")
        # `fragment call` answers {id, replayed, result}: the operation's own answer is `result`.
        return (data or {}).get("result") if args[0] == "call" else data, ""
    error = answer.get("error")
    text = error.get("message") if isinstance(error, dict) else error
    return None, (text or (done.stderr or done.stdout or "no output").strip().splitlines()[-1])[:300]


def find_app(paths):
    """The app's folder and fragment name: the one folder under ~/hackathon that sync keeps."""
    if paths:
        folders = [os.path.abspath(os.path.expanduser(paths[0]))]
    else:
        folders = sorted(os.path.dirname(os.path.dirname(p)) for p in glob.glob(os.path.join(HACKATHON, "*", ".fragment", "state.json")))
    if not folders:
        return None, None, "No app folder under ~/hackathon yet: do Step 4 (fragment create, then fragment sync into a folder)."
    if len(folders) > 1:
        names = ", ".join(os.path.basename(f) for f in folders)
        return None, None, f"Several app folders under ~/hackathon ({names}): run this with the app's folder, e.g. python3 ~/hackathon/check.py ~/hackathon/{os.path.basename(folders[0])}"
    folder = folders[0]
    try:
        with open(os.path.join(folder, ".fragment", "state.json")) as handle:
            name = json.load(handle).get("name")
    except (OSError, ValueError):
        name = None
    if not name:
        return folder, None, f"{folder} isn't synced with a fragment yet: run fragment deploy <your app> --dir {folder}"
    return folder, name, None


def check_live(name, folder):
    status, error = fragment("status", name)
    if status is None:
        return [f"fragment status {name} failed ({error})."], None, None
    problems = []
    pins = status.get("pins") or {}
    url = (status.get("urls") or {}).get("canonical")
    if not pins.get("live"):
        problems.append(f"The app isn't deployed yet: fragment deploy {name} --dir {folder}")
    elif pins.get("main") != pins.get("live"):
        problems.append(f"There are changes that aren't live (yours or a teammate's): fragment deploy {name} --dir {folder}")
    code_error = (status.get("code") or {}).get("error")
    if code_error:
        problems.append(f"The platform refused the app's code ({str(code_error)[:200]}): fix it, then deploy again.")
    page = status.get("page") or {}
    if page.get("live") and page.get("live") == pins.get("live") and page.get("errors"):
        first = page["errors"][0]
        text = first.get("text") if isinstance(first, dict) else str(first)
        problems.append(f"The live page has errors ({len(page['errors'])}; first: {str(text)[:160]}): fix them, then deploy again.")
    return problems, url, status


def check_alex(name, status):
    if status.get("owner") == ALEX_NPUB:
        return []
    members, error = fragment("members", "list", name)
    if members is not None and ALEX_NPUB in {m.get("principal") for m in members.get("members") or []}:
        return []
    invites, _ = fragment("invite", "list", name)
    if invites is not None and ALEX in {i.get("email") for i in invites.get("invites") or []}:
        return []
    _, error = fragment("members", "add", name, ALEX, "--role", "viewer")
    if error and not re.search(r"already|own", error, re.IGNORECASE):
        return [f"Couldn't share the app with Alex ({error}): fragment members add {name} {ALEX} --role viewer"]
    return []


def check_board(url, folder, early):
    me, error = fragment("call", BOARD, "me", "--input", "{}")
    if me is None:
        return [f"Couldn't reach Alex's board ({error}): fragment call {BOARD} me --input '{{}}'"]
    entry = me.get("entry") or {}
    if url and entry.get("demoUrl") != url and entry.get("phase") != "ready":
        entry, error = fragment("call", BOARD, "progress", "--input", json.dumps({"demoUrl": url}))
        if entry is None:
            return [f"Couldn't put the app's link on Alex's board ({error}): fragment call {BOARD} progress --input '{json.dumps({'demoUrl': url})}'"]
    problems = []
    if not entry.get("person"):
        problems.append(f"Alex's board doesn't have your person's name: fragment call {BOARD} progress --input '{{\"person\":\"Their name\"}}'")
    if early:
        return problems
    submit = {"demoUrl": url} if url else {}
    if entry.get("phase") != "ready" or entry.get("demoUrl") != url:
        problems.append(f"Not submitted with this app's link: fragment call {BOARD} submit --input '{json.dumps(submit)}' "
                        "(add \"slidesUrl\" if there are slides)")
    slides = entry.get("slidesUrl")
    if slides and url:
        if not slides.startswith(url):
            problems.append(f"The slides link ({slides}) isn't on this app: put them at {url}slides/ and submit again.")
        else:
            path = slides[len(url):].split("?")[0].strip("/")
            if not os.path.isfile(os.path.join(folder, "site", path, "index.html")):
                problems.append(f"The board has slides at {slides}, but site/{path}/index.html isn't in {folder}: "
                                "add them and deploy, or submit again without slidesUrl.")
    return problems


def add_teammate(name, email):
    if not EMAIL.fullmatch(email or ""):
        print(f"FIX: {email!r} doesn't look like an email address. Ask your person to check it.")
        return 1
    _, error = fragment("members", "add", name, email, "--role", "editor")
    if error and not re.search(r"already", error, re.IGNORECASE):
        print(f"FIX: couldn't invite {email} ({error}). Check the email with your person, then run this again.")
        return 1
    print(f"ALL GOOD: {email} is invited to edit {name}. Finite emails them; they accept on finite.chat.")
    print("Add them to TEAM.md if they aren't there, deploy, and give your person this line to send them:\n")
    print(f"Paste this into your agent (Finite, Claude Code, or Codex): Read {SITE}/join.md and join {name} as {email}")
    return 0


def minutes_left():
    """Starts the clock on first use. Alex calling time sooner: write the new epoch to ~/hackathon/deadline."""
    if not os.path.isfile(DEADLINE):
        os.makedirs(HACKATHON, exist_ok=True)
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
    teammate_at = sys.argv.index("--add-teammate") + 1 if "--add-teammate" in sys.argv else -1
    paths = [arg for i, arg in enumerate(sys.argv) if i > 0 and i != teammate_at and not arg.startswith("--")]
    folder, name, problem = find_app(paths)
    if problem:
        print(f"FIX: {problem}")
        return 1
    if teammate_at > 0:
        return add_teammate(name, sys.argv[teammate_at] if teammate_at < len(sys.argv) else "")
    early = "--early" in sys.argv
    problems, url, status = check_live(name, folder)
    if status is not None:
        problems += check_alex(name, status)
        problems += check_board(url, folder, early)
    for line in problems:
        print(f"FIX: {line}")
    if problems:
        print(f"\n{len(problems)} to fix. Fix them, then run this check again.")
        return 1
    print(f"App: {url}")
    if early:
        print("ALL GOOD so far: the app is live, Alex is invited, and its link is on his board. Tick Step 4.")
    else:
        print("ALL GOOD: you're on Alex's presentation list.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
