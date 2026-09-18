"""Export a sanitized, disconnected Git snapshot; never rewrite the source repo.
Usage: python3 scripts/export_public.py NEW_DESTINATION
The destination must not exist. Review ASSET-RIGHTS.md before publication.
"""
import datetime
import io
import ipaddress
import json
from pathlib import Path
import re
import subprocess
import sys
import zipfile

source = Path(__file__).resolve().parents[1]
destination = Path(sys.argv[1]).resolve()
if destination.exists():
    raise SystemExit("Destination exists; refusing to replace preserved work.")
if subprocess.check_output(["git", "status", "--porcelain"], cwd=source).strip():
    raise SystemExit("Commit source changes before exporting a reproducible snapshot.")
archive = subprocess.check_output(["git", "archive", "--format=zip", "HEAD"], cwd=source)
skip = {"RESEARCH-LOG.md", "DESIGN.md", "docs/MILESTONES.md"}
changed = []
excluded = []
destination.mkdir(parents=True)

def scrub(text):
    text = re.sub(r"/(?:Users|home)/[^\s\"'<>:)]+", "<LOCAL_PATH>", text)
    def redact_ip(match):
        try:
            ip = ipaddress.ip_address(match.group())
            if ip.is_loopback or ip.is_unspecified:
                return match.group()
            if ip.is_private or ip in ipaddress.ip_network("<PRIVATE_IP>/10"):
                return "<PRIVATE_IP>"
        except ValueError:
            pass
        return match.group()
    return re.sub(r"\b(?:\d{1,3}\.){3}\d{1,3}\b", redact_ip, text)

with zipfile.ZipFile(io.BytesIO(archive)) as bundle:
    for member in bundle.infolist():
        name = member.filename
        if member.is_dir():
            continue
        if name in skip or name.startswith("issues/") or name == "logs/dev-server.txt":
            excluded.append(name)
            continue
        target = destination / name
        if not target.resolve().is_relative_to(destination):
            raise SystemExit("Unsafe archive path")
        data = bundle.read(member)
        if not name.endswith((".png", ".glb")):
            original = data.decode("utf-8")
            cleaned = scrub(original)
            if cleaned != original:
                changed.append(name)
            data = cleaned.encode("utf-8")
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)

readme = destination / "README.md"
text = readme.read_text()
text = text.replace("Use the IPv4 address: another local application may occupy IPv6 localhost.（打开此 IPv4 地址；本机其他应用可能占用 IPv6 localhost。）", "（在浏览器打开此地址。）")
text = text.split("Changes are preserved on `issue/1-sailboat-atlas`")[0]
text += "\n## Release status（发布状态）\n\nThis is a sanitized educational prototype snapshot. Application code is MIT; model-related rights remain unresolved under ASSET-RIGHTS.md. This local repository has not been published. CI configuration is included, but hosted checks and branch protection are not yet verified.（这是脱敏的教学原型快照；应用代码采用 MIT，模型相关权利仍待确认。此本地仓库尚未发布，CI 与分支保护未在托管平台验证。）\n"
readme.write_text(text)
record = {
    "created_local": datetime.datetime.now().astimezone().isoformat(),
    "strategy": "New main root commit; original private history preserved outside this repository",
    "excluded_files": excluded,
    "sanitized_text_files": changed,
    "publication": "not performed",
    "asset_rights": "unresolved; see ASSET-RIGHTS.md",
}
(destination / "docs/SANITIZATION.json").write_text(json.dumps(record, indent=2) + "\n")
subprocess.run(["git", "init", "-b", "main"], cwd=destination, check=True, capture_output=True)
for key,value in [("user.name", "Solo Pacific Atlas contributors"), ("user.email", "atlas@users.noreply.github.com")]:
    subprocess.run(["git", "config", key, value], cwd=destination, check=True)
subprocess.run(["git", "add", "."], cwd=destination, check=True)
subprocess.run(["git", "-c", "commit.gpgsign=false", "commit", "-m", "Prepare sanitized educational atlas release candidate"], cwd=destination, check=True)
print("Created isolated sanitized repository. Publication hold: review ASSET-RIGHTS.md.")
