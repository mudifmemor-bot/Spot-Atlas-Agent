// The only numeric values in the storage format are dictionary indexes and offsets.
// All public cell values are the original CSV strings, including IDs and money.
const dataRoot = new URL("./data/", import.meta.url);

async function fetchFile(name) {
  const response = await fetch(new URL(name, dataRoot));
  if (!response.ok) throw new Error(`Registry asset ${name}: HTTP ${response.status}`);
  return response;
}

function makeColumn(column, count) {
  if (Array.isArray(column)) {
    if (column.length !== count) throw new Error("Invalid raw column length");
    return index => column[index];
  }
  if (!Array.isArray(column.dict) || column.codes?.length !== count) {
    throw new Error("Invalid dictionary column");
  }
  const {dict, codes} = column;
  const Type = dict.length <= 256 ? Uint8Array : dict.length <= 65536 ? Uint16Array : Uint32Array;
  const keys = new Type(codes);
  return index => dict[keys[index]];
}

async function readPart(part, schema) {
  const response = await fetchFile(part.asset);
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength !== part.bytes) throw new Error("Incomplete registry download");
  if (globalThis.crypto?.subtle) {
    const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
    const hex = Array.from(hash, byte => byte.toString(16).padStart(2,"0")).join("");
    if (hex !== part.sha256) throw new Error("Registry checksum mismatch");
  }
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
  const columns = await new Response(stream).json();
  if (columns.length !== schema.fields.length) throw new Error("Registry schema mismatch");
  return Object.fromEntries(schema.fields.map((field, i) => [field, makeColumn(columns[i], part.count)]));
}

class Table {
  constructor(schema, parts) {
    this.length = schema.count;
    this.fields = schema.fields;
    this.parts = parts;
    this.origin = schema.parts;
    this.starts = [];
    this.partForRow = new Uint16Array(this.length);
    let pos = 0;
    schema.parts.forEach((part, index) => {
      this.starts.push(pos);
      this.partForRow.fill(index, pos, pos + part.count);
      pos += part.count;
    });
    if (pos !== this.length) throw new Error("Invalid table size");
  }
  get(i, field) {
    const part = this.partForRow[i];
    if (part === undefined) throw new RangeError("Registry row index outside the table");
    return this.parts[part][field](i - this.starts[part]);
  }
  row(i) {
    return Object.fromEntries(this.fields.map(field => [field, this.get(i, field)]));
  }
  source(i) {
    const part = this.partForRow[i];
    if (part === undefined) throw new RangeError("Registry row index outside the table");
    return {file: this.origin[part].file, line: this.origin[part].line + i - this.starts[part]};
  }
}

let ready;
export function loadData(progress) {
  if (!ready) ready = loadAll(progress).catch(error => { ready = undefined; throw error; });
  return ready;
}

async function loadAll(progress) {
  const manifest = await (await fetchFile("manifest.json")).json();
  if (manifest.version !== 1) throw new Error("Unsupported registry version");
  const jobs = [];
  const parts = {};
  let total = 0;
  let loaded = 0;
  for (const [name, schema] of Object.entries(manifest.tables)) {
    parts[name] = [];
    schema.parts.forEach((part, index) => {
      total += part.bytes;
      jobs.push({name, schema, part, index});
    });
  }
  progress?.({loaded, total});
  let next = 0;
  async function download() {
    while (next < jobs.length) {
      const {name, schema, part, index} = jobs[next++];
      parts[name][index] = await readPart(part, schema);
      loaded += part.bytes;
      progress?.({loaded, total});
    }
  }
  await Promise.all(Array.from({length: Math.min(3, jobs.length)}, download));
  const data = {manifest};
  for (const [name, schema] of Object.entries(manifest.tables)) {
    const table = new Table(schema, parts[name]);
    data[name] = name === "deals" ? table : Array.from({length: table.length}, (_, i) => {
      const {file, line} = table.source(i);
      return {...table.row(i), _file: file, _line: line};
    });
  }
  return data;
}
