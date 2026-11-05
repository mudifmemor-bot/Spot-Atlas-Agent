"""Build the static registry and validate every encoded cell against the source CSV."""
import argparse
import csv
import gzip
import hashlib
import itertools
import json
from pathlib import Path


PROJECT = Path(__file__).resolve().parent
FIELDS = {
    "deals": "id date time type quantity amount startPrice contract product lot unit region contractType tradeForm status seller buyer sellerBroker buyerBroker paymentDate deliveryDate delivered",
    "contracts": "id name brand size grade kind class hsCode group category industry unit lot currency basePrice deposit basis region warehouse type contractType tradeForm paymentTerm deliveryTerm package seller registered validTo",
    "participants": "id name region type role vat",
    "brokers": "id name tin region",
    "rates": "date rate",
}
YEARS = range(2022, 2027)
CHUNK_ROWS = 20000


def compact(values):
    """Dictionary code repeated cell text, never convert a CSV number to float."""
    codes = {value: i for i, value in enumerate(dict.fromkeys(values))}
    if len(codes) * 3 < len(values) * 2:
        return {"dict": list(codes), "codes": [codes[value] for value in values]}
    return values


def check_cells(payload, original):
    for index, column in enumerate(payload):
        if isinstance(column, dict):
            values = [column["dict"][code] for code in column["codes"]]
        else:
            values = column
        if len(values) != len(original) or any(value != row[index] for value, row in zip(values, original)):
            raise ValueError(f"Round-trip mismatch in column {index}")


def build(source, dest):
    dest.mkdir(parents=True, exist_ok=True)
    files = {
        "participants": ["participants.csv"],
        "brokers": ["brokers.csv"],
        "rates": ["usd_rates.csv"],
        "contracts": ["contracts.csv"],
        "deals": [f"deals_{year}.csv" for year in YEARS],
    }
    indexes = {}
    manifest = {"version": 1, "tables": {}, "sources": []}
    for name, filenames in files.items():
        aliases = FIELDS[name].split()
        table = {"fields": aliases, "headers": [], "count": 0, "parts": []}
        manifest["tables"][name] = table
        indexes[name] = set()
        for filename in filenames:
            path = source / filename
            source_count = 0
            with path.open("r", encoding="utf-8-sig", newline="") as file:
                reader = csv.reader(file, strict=True)
                header = next(reader)
                if len(header) != len(aliases) or (table["headers"] and table["headers"] != header):
                    raise ValueError(f"Unexpected header in {filename}")
                table["headers"] = header
                while rows := list(itertools.islice(reader, CHUNK_ROWS)):
                    start = source_count + 2
                    for offset, row in enumerate(rows):
                        if len(row) != len(aliases) or row[0] in indexes[name] or not row[0]:
                            raise ValueError(f"Invalid row or duplicate key at {filename}:{start + offset}")
                        indexes[name].add(row[0])
                        if name == "deals":
                            refs = [(7,"contracts"), (15,"participants"), (16,"participants"),
                                    (17,"brokers"), (18,"brokers"), (1,"rates")]
                        elif name == "contracts":
                            refs = [(25,"participants")]
                        else:
                            refs = []
                        if any(row[col] not in indexes[target] for col,target in refs):
                            raise ValueError(f"Unresolved foreign key at {filename}:{start + offset}")
                    columns = [compact(column) for column in zip(*rows)]
                    blob = gzip.compress(json.dumps(columns, ensure_ascii=False, separators=(",",":")).encode(),
                                         compresslevel=6, mtime=0)
                    check_cells(json.loads(gzip.decompress(blob)), rows)
                    digest = hashlib.sha256(blob).hexdigest()
                    asset = f"{path.stem}-{start}-{digest[:12]}.bin"
                    (dest / asset).write_bytes(blob)
                    table["parts"].append({"asset": asset, "file": filename, "line": start,
                                           "count": len(rows), "bytes": len(blob), "sha256": digest})
                    source_count += len(rows)
                    table["count"] += len(rows)
            manifest["sources"].append({"file": filename, "count": source_count,
                                        "sha256": hashlib.sha256(path.read_bytes()).hexdigest()})
            print(f"{filename}: {source_count:,} records validated", flush=True)
    manifest_path = dest / "manifest.json"
    temporary = manifest_path.with_suffix(".tmp")
    temporary.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf8")
    temporary.replace(manifest_path)
    referenced = {part["asset"] for table in manifest["tables"].values() for part in table["parts"]}
    for asset in dest.glob("*.bin"):
        if asset.name not in referenced and any(asset.name.startswith(Path(f).stem + "-") for fs in files.values() for f in fs):
            asset.unlink()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=PROJECT.parent)
    parser.add_argument("--dest", type=Path, default=PROJECT / "dist" / "data")
    args = parser.parse_args()
    build(args.source, args.dest)
