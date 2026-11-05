"""Package the same worker and registry for double-click rehearsal without a server."""
import base64
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DIST = ROOT / "dist"


def bundle_module(name):
    code = (DIST / f"{name}.js").read_text(encoding="utf8")
    if name == "data":
        begin = code.index("const dataRoot")
        end = code.index("function makeColumn", begin)
        code = code[:begin] + """async function fetchFile(name) {
          const raw = self.registry[name];
          if (!raw) throw Error('Missing offline registry asset');
          return new Response(Uint8Array.from(atob(raw), ch => ch.charCodeAt(0)));
        }
        """ + code[end:]
    code = re.sub(r"import\s*\{([^}]+)\}\s*from\s*['\"]\./(\w+)\.js['\"];", r"const {\1} = modules.\2;", code)
    names = re.findall(r"export function (\w+)", code)
    code = code.replace("export function ", "function ")
    return "modules." + name + " = (()=>{\n" + code + "\nreturn {" + ",".join(names) + "};\n})();\n"


def make_offline(target):
    data = {x.name: base64.b64encode(x.read_bytes()).decode("ascii")
            for x in sorted((DIST / "data").iterdir()) if x.is_file()}
    worker = "self.registry=" + json.dumps(data, separators=(",", ":")) + ";\nconst modules={};\n"
    worker += "".join(bundle_module(name) for name in
                      ("data", "filters", "lookup", "directory", "analytics", "engine", "worker"))
    local = DIST / "local"
    local.mkdir(exist_ok=True)
    files = []
    for i, start in enumerate(range(0, len(worker), 4_000_000)):
        name = f"worker-{i}.js"
        part = worker[start:start+4_000_000]
        (local / name).write_text(f"window.spotLocalParts[{i}]={json.dumps(part)};\n", encoding="utf8")
        files.append("./local/" + name)
    (local / "files.js").write_text("window.spotLocalFiles=" + json.dumps(files) + ";", encoding="utf8")
    page = (DIST / "index.html").read_text(encoding="utf8")
    css = (DIST / "style.css").read_text(encoding="utf8")
    ui = (DIST / "ui.js").read_text(encoding="utf8")
    page = page.replace('<link rel="stylesheet" href="./style.css">', "<style>" + css + "</style>")
    page = page.replace('<script src="./start.js"></script>',
                        '<script type="text/plain" id="bundled-worker">' + worker.replace("</script", "<\\/script") +
                        "</script><script>" + ui + "</script>")
    target.write_text(page, encoding="utf8")


if __name__ == "__main__":
    make_offline(ROOT / "Spot-Atlas-offline.html")
