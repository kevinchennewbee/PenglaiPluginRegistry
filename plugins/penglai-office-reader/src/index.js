import { unzipSync } from "fflate";

export const name = "@penglai/office-reader";
export const version = "0.1.1";
export const inject = ["tools", "fs"];

const MAX_ARCHIVE_BYTES = 32 * 1024 * 1024;
const MAX_EXPANDED_BYTES = 64 * 1024 * 1024;
const MAX_ENTRY_BYTES = 16 * 1024 * 1024;
const MAX_ENTRIES = 4096;
const MAX_OUTPUT_CHARS = 100_000;

function fail(message) {
  throw new Error(`penglai-office-reader: ${message}`);
}

function extension(path) {
  const match = /\.([^.\\/]+)$/.exec(path);
  return match?.[1]?.toLowerCase() ?? "";
}

function decodeXml(bytes) {
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

function unescapeXml(value) {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&")
    .replace(/&#(\d+);/g, (_, decimal) => String.fromCodePoint(Number(decimal)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)));
}

function tagText(xml, tag) {
  const values = [];
  const pattern = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "g");
  for (const match of xml.matchAll(pattern)) {
    values.push(unescapeXml(match[1].replace(/<[^>]+>/g, "")));
  }
  return values.join("");
}

function preflightZip(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const floor = Math.max(0, bytes.byteLength - 65_557);
  let eocd = -1;
  for (let at = bytes.byteLength - 22; at >= floor; at -= 1) {
    if (view.getUint32(at, true) === 0x06054b50) {
      eocd = at;
      break;
    }
  }
  if (eocd < 0) fail("ZIP end record missing");
  const count = view.getUint16(eocd + 10, true);
  const centralSize = view.getUint32(eocd + 12, true);
  const centralOffset = view.getUint32(eocd + 16, true);
  if (count < 1 || count > MAX_ENTRIES) fail("ZIP entry count is outside policy");
  if (centralOffset + centralSize > eocd) fail("ZIP central directory is invalid");
  let at = centralOffset;
  let expanded = 0;
  for (let index = 0; index < count; index += 1) {
    if (at + 46 > bytes.byteLength || view.getUint32(at, true) !== 0x02014b50) {
      fail("ZIP central directory entry is invalid");
    }
    const uncompressed = view.getUint32(at + 24, true);
    const nameLength = view.getUint16(at + 28, true);
    const extraLength = view.getUint16(at + 30, true);
    const commentLength = view.getUint16(at + 32, true);
    const nameBytes = bytes.subarray(at + 46, at + 46 + nameLength);
    const entryName = new TextDecoder("utf-8", { fatal: true }).decode(nameBytes);
    if (
      !entryName ||
      entryName.includes("\0") ||
      entryName.startsWith("/") ||
      entryName.startsWith("\\") ||
      entryName.split(/[\\/]/).includes("..")
    ) {
      fail("ZIP entry path is unsafe");
    }
    if (uncompressed > MAX_ENTRY_BYTES) fail("ZIP entry is too large");
    expanded += uncompressed;
    if (expanded > MAX_EXPANDED_BYTES) fail("ZIP expanded size is too large");
    at += 46 + nameLength + extraLength + commentLength;
  }
}

function unzipOffice(bytes) {
  preflightZip(bytes);
  try {
    return unzipSync(bytes);
  } catch {
    fail("Office ZIP is malformed or encrypted");
  }
}

function naturalNumber(name) {
  return Number(/(\d+)(?=\.xml$)/.exec(name)?.[1] ?? Number.MAX_SAFE_INTEGER);
}

function extractDocx(files) {
  const names = Object.keys(files)
    .filter((name) => /^word\/(document|header\d*|footer\d*)\.xml$/.test(name))
    .sort((a, b) => (a === "word/document.xml" ? -1 : b === "word/document.xml" ? 1 : a.localeCompare(b)));
  if (!names.includes("word/document.xml")) fail("DOCX document.xml is missing");
  const sections = names.map((file) => {
    const xml = decodeXml(files[file]);
    const paragraphs = [...xml.matchAll(/<w:p(?:\s[^>]*)?>([\s\S]*?)<\/w:p>/g)]
      .map((match) => tagText(match[1], "w:t"))
      .filter(Boolean);
    return { name: file, text: paragraphs.join("\n") };
  });
  return { format: "docx", sections };
}

function extractPptx(files) {
  const names = Object.keys(files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => naturalNumber(a) - naturalNumber(b));
  if (!names.length) fail("PPTX slides are missing");
  const sections = names.map((file, index) => ({
    name: `Slide ${index + 1}`,
    text: tagText(decodeXml(files[file]), "a:t"),
  }));
  return { format: "pptx", sections };
}

function extractXlsx(files) {
  const shared = files["xl/sharedStrings.xml"]
    ? [...decodeXml(files["xl/sharedStrings.xml"]).matchAll(/<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g)].map((match) =>
        tagText(match[1], "t"),
      )
    : [];
  const names = Object.keys(files)
    .filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name))
    .sort((a, b) => naturalNumber(a) - naturalNumber(b));
  if (!names.length) fail("XLSX worksheets are missing");
  const sections = names.map((file, index) => {
    const xml = decodeXml(files[file]);
    const cells = [];
    for (const match of xml.matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attrs = match[1];
      const body = match[2];
      const ref = /\br="([^"]+)"/.exec(attrs)?.[1] ?? `cell-${cells.length + 1}`;
      const type = /\bt="([^"]+)"/.exec(attrs)?.[1] ?? "n";
      const raw = /<v(?:\s[^>]*)?>([\s\S]*?)<\/v>/.exec(body)?.[1] ?? "";
      const formula = /<f(?:\s[^>]*)?>([\s\S]*?)<\/f>/.exec(body)?.[1];
      let value = unescapeXml(raw);
      if (type === "s") value = shared[Number(raw)] ?? "";
      if (type === "inlineStr") value = tagText(body, "t");
      cells.push(`${ref}: ${formula ? `=${unescapeXml(formula)} -> ` : ""}${value}`);
    }
    return { name: `Sheet ${index + 1}`, text: cells.join("\n") };
  });
  return { format: "xlsx", sections };
}

export function extractOfficeBytes(bytes, format) {
  if (!(bytes instanceof Uint8Array)) fail("input is not bytes");
  if (bytes.byteLength > MAX_ARCHIVE_BYTES) fail("Office file exceeds 32 MiB");
  const files = unzipOffice(bytes);
  if (format === "docx") return extractDocx(files);
  if (format === "xlsx") return extractXlsx(files);
  if (format === "pptx") return extractPptx(files);
  fail("supported extensions are .docx, .xlsx, and .pptx");
}

function capOutput(extracted) {
  const full = extracted.sections
    .filter((section) => section.text)
    .map((section) => `## ${section.name}\n${section.text}`)
    .join("\n\n");
  const truncated = full.length > MAX_OUTPUT_CHARS;
  return {
    format: extracted.format,
    sections: extracted.sections.length,
    text: truncated ? full.slice(0, MAX_OUTPUT_CHARS) : full,
    truncated,
  };
}

export function apply(ctx) {
  ctx.tools.register({
    name: "penglai_office_extract",
    description:
      "Read text and cell values from one DOCX, XLSX, or PPTX file through the DSH filesystem. Read-only; does not preserve layout, execute macros, or calculate formulas.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        file_path: {
          type: "string",
          required: true,
          description: "Path to a .docx, .xlsx, or .pptx file in the active workspace.",
        },
      },
    },
    output: {
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["path", "bytes", "format", "sections", "text", "truncated"],
        properties: {
          path: { type: "string" },
          bytes: { type: "integer" },
          format: { type: "string" },
          sections: { type: "integer" },
          text: { type: "string" },
          truncated: { type: "boolean" },
        },
      },
      render: (_args, value) => [
        {
          type: "text",
          text: `[UNTRUSTED OFFICE FILE CONTENT]\n${value.text}`,
        },
      ],
      presentationMeta: (_args, value) => ({
        path: value.path,
        bytes: value.bytes,
        format: value.format,
        sections: value.sections,
        truncated: value.truncated,
      }),
    },
    async execute(args, exec) {
      if (!args || typeof args.file_path !== "string" || !args.file_path.trim()) {
        fail("file_path is required");
      }
      const format = extension(args.file_path);
      if (!new Set(["docx", "xlsx", "pptx"]).has(format)) {
        fail("supported extensions are .docx, .xlsx, and .pptx");
      }
      const target = await ctx.fs.resolve(args.file_path, { signal: exec?.signal });
      const info = await ctx.fs.stat(target, exec?.signal);
      if (!info || info.type !== "file") fail("target is not a regular file");
      if (info.size > MAX_ARCHIVE_BYTES) fail("Office file exceeds 32 MiB");
      const bytes = await ctx.fs.readBytes(target, exec?.signal, MAX_ARCHIVE_BYTES);
      return {
        path: target.displayPath,
        bytes: bytes.byteLength,
        ...capOutput(extractOfficeBytes(bytes, format)),
      };
    },
  });
  return { version, readOnly: true, formats: ["docx", "xlsx", "pptx"] };
}

Object.assign(apply, { inject });
export default { name, version, inject, apply };
