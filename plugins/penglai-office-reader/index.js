// node_modules/fflate/esm/index.mjs
import { createRequire } from "module";
var require2 = createRequire("/");
var Worker;
try {
  Worker = require2("worker_threads").Worker;
} catch (e) {
}
var u8 = Uint8Array;
var u16 = Uint16Array;
var i32 = Int32Array;
var fleb = new u8([
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  1,
  1,
  1,
  1,
  2,
  2,
  2,
  2,
  3,
  3,
  3,
  3,
  4,
  4,
  4,
  4,
  5,
  5,
  5,
  5,
  0,
  /* unused */
  0,
  0,
  /* impossible */
  0
]);
var fdeb = new u8([
  0,
  0,
  0,
  0,
  1,
  1,
  2,
  2,
  3,
  3,
  4,
  4,
  5,
  5,
  6,
  6,
  7,
  7,
  8,
  8,
  9,
  9,
  10,
  10,
  11,
  11,
  12,
  12,
  13,
  13,
  /* unused */
  0,
  0
]);
var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
var freb = function(eb, start) {
  var b = new u16(31);
  for (var i = 0; i < 31; ++i) {
    b[i] = start += 1 << eb[i - 1];
  }
  var r = new i32(b[30]);
  for (var i = 1; i < 30; ++i) {
    for (var j = b[i]; j < b[i + 1]; ++j) {
      r[j] = j - b[i] << 5 | i;
    }
  }
  return { b, r };
};
var _a = freb(fleb, 2);
var fl = _a.b;
var revfl = _a.r;
fl[28] = 258, revfl[258] = 28;
var _b = freb(fdeb, 0);
var fd = _b.b;
var revfd = _b.r;
var rev = new u16(32768);
for (i = 0; i < 32768; ++i) {
  x = (i & 43690) >> 1 | (i & 21845) << 1;
  x = (x & 52428) >> 2 | (x & 13107) << 2;
  x = (x & 61680) >> 4 | (x & 3855) << 4;
  rev[i] = ((x & 65280) >> 8 | (x & 255) << 8) >> 1;
}
var x;
var i;
var hMap = (function(cd, mb, r) {
  var s = cd.length;
  var i = 0;
  var l = new u16(mb);
  for (; i < s; ++i) {
    if (cd[i])
      ++l[cd[i] - 1];
  }
  var le = new u16(mb);
  for (i = 1; i < mb; ++i) {
    le[i] = le[i - 1] + l[i - 1] << 1;
  }
  var co;
  if (r) {
    co = new u16(1 << mb);
    var rvb = 15 - mb;
    for (i = 0; i < s; ++i) {
      if (cd[i]) {
        var sv = i << 4 | cd[i];
        var r_1 = mb - cd[i];
        var v = le[cd[i] - 1]++ << r_1;
        for (var m = v | (1 << r_1) - 1; v <= m; ++v) {
          co[rev[v] >> rvb] = sv;
        }
      }
    }
  } else {
    co = new u16(s);
    for (i = 0; i < s; ++i) {
      if (cd[i]) {
        co[i] = rev[le[cd[i] - 1]++] >> 15 - cd[i];
      }
    }
  }
  return co;
});
var flt = new u8(288);
for (i = 0; i < 144; ++i)
  flt[i] = 8;
var i;
for (i = 144; i < 256; ++i)
  flt[i] = 9;
var i;
for (i = 256; i < 280; ++i)
  flt[i] = 7;
var i;
for (i = 280; i < 288; ++i)
  flt[i] = 8;
var i;
var fdt = new u8(32);
for (i = 0; i < 32; ++i)
  fdt[i] = 5;
var i;
var flrm = /* @__PURE__ */ hMap(flt, 9, 1);
var fdrm = /* @__PURE__ */ hMap(fdt, 5, 1);
var max = function(a) {
  var m = a[0];
  for (var i = 1; i < a.length; ++i) {
    if (a[i] > m)
      m = a[i];
  }
  return m;
};
var bits = function(d, p, m) {
  var o = p / 8 | 0;
  return (d[o] | d[o + 1] << 8) >> (p & 7) & m;
};
var bits16 = function(d, p) {
  var o = p / 8 | 0;
  return (d[o] | d[o + 1] << 8 | d[o + 2] << 16) >> (p & 7);
};
var shft = function(p) {
  return (p + 7) / 8 | 0;
};
var slc = function(v, s, e) {
  if (s == null || s < 0)
    s = 0;
  if (e == null || e > v.length)
    e = v.length;
  return new u8(v.subarray(s, e));
};
var ec = [
  "unexpected EOF",
  "invalid block type",
  "invalid length/literal",
  "invalid distance",
  "stream finished",
  "no stream handler",
  ,
  "no callback",
  "invalid UTF-8 data",
  "extra field too long",
  "date not in range 1980-2099",
  "filename too long",
  "stream finishing",
  "invalid zip data"
  // determined by unknown compression method
];
var err = function(ind, msg, nt) {
  var e = new Error(msg || ec[ind]);
  e.code = ind;
  if (Error.captureStackTrace)
    Error.captureStackTrace(e, err);
  if (!nt)
    throw e;
  return e;
};
var inflt = function(dat, st, buf, dict) {
  var sl = dat.length, dl = dict ? dict.length : 0;
  if (!sl || st.f && !st.l)
    return buf || new u8(0);
  var noBuf = !buf;
  var resize = noBuf || st.i != 2;
  var noSt = st.i;
  if (noBuf)
    buf = new u8(sl * 3);
  var cbuf = function(l2) {
    var bl = buf.length;
    if (l2 > bl) {
      var nbuf = new u8(Math.max(bl * 2, l2));
      nbuf.set(buf);
      buf = nbuf;
    }
  };
  var final = st.f || 0, pos = st.p || 0, bt = st.b || 0, lm = st.l, dm = st.d, lbt = st.m, dbt = st.n;
  var tbts = sl * 8;
  do {
    if (!lm) {
      final = bits(dat, pos, 1);
      var type = bits(dat, pos + 1, 3);
      pos += 3;
      if (!type) {
        var s = shft(pos) + 4, l = dat[s - 4] | dat[s - 3] << 8, t = s + l;
        if (t > sl) {
          if (noSt)
            err(0);
          break;
        }
        if (resize)
          cbuf(bt + l);
        buf.set(dat.subarray(s, t), bt);
        st.b = bt += l, st.p = pos = t * 8, st.f = final;
        continue;
      } else if (type == 1)
        lm = flrm, dm = fdrm, lbt = 9, dbt = 5;
      else if (type == 2) {
        var hLit = bits(dat, pos, 31) + 257, hcLen = bits(dat, pos + 10, 15) + 4;
        var tl = hLit + bits(dat, pos + 5, 31) + 1;
        pos += 14;
        var ldt = new u8(tl);
        var clt = new u8(19);
        for (var i = 0; i < hcLen; ++i) {
          clt[clim[i]] = bits(dat, pos + i * 3, 7);
        }
        pos += hcLen * 3;
        var clb = max(clt), clbmsk = (1 << clb) - 1;
        var clm = hMap(clt, clb, 1);
        for (var i = 0; i < tl; ) {
          var r = clm[bits(dat, pos, clbmsk)];
          pos += r & 15;
          var s = r >> 4;
          if (s < 16) {
            ldt[i++] = s;
          } else {
            var c = 0, n = 0;
            if (s == 16)
              n = 3 + bits(dat, pos, 3), pos += 2, c = ldt[i - 1];
            else if (s == 17)
              n = 3 + bits(dat, pos, 7), pos += 3;
            else if (s == 18)
              n = 11 + bits(dat, pos, 127), pos += 7;
            while (n--)
              ldt[i++] = c;
          }
        }
        var lt = ldt.subarray(0, hLit), dt = ldt.subarray(hLit);
        lbt = max(lt);
        dbt = max(dt);
        lm = hMap(lt, lbt, 1);
        dm = hMap(dt, dbt, 1);
      } else
        err(1);
      if (pos > tbts) {
        if (noSt)
          err(0);
        break;
      }
    }
    if (resize)
      cbuf(bt + 131072);
    var lms = (1 << lbt) - 1, dms = (1 << dbt) - 1;
    var lpos = pos;
    for (; ; lpos = pos) {
      var c = lm[bits16(dat, pos) & lms], sym = c >> 4;
      pos += c & 15;
      if (pos > tbts) {
        if (noSt)
          err(0);
        break;
      }
      if (!c)
        err(2);
      if (sym < 256)
        buf[bt++] = sym;
      else if (sym == 256) {
        lpos = pos, lm = null;
        break;
      } else {
        var add = sym - 254;
        if (sym > 264) {
          var i = sym - 257, b = fleb[i];
          add = bits(dat, pos, (1 << b) - 1) + fl[i];
          pos += b;
        }
        var d = dm[bits16(dat, pos) & dms], dsym = d >> 4;
        if (!d)
          err(3);
        pos += d & 15;
        var dt = fd[dsym];
        if (dsym > 3) {
          var b = fdeb[dsym];
          dt += bits16(dat, pos) & (1 << b) - 1, pos += b;
        }
        if (pos > tbts) {
          if (noSt)
            err(0);
          break;
        }
        if (resize)
          cbuf(bt + 131072);
        var end = bt + add;
        if (bt < dt) {
          var shift = dl - dt, dend = Math.min(dt, end);
          if (shift + bt < 0)
            err(3);
          for (; bt < dend; ++bt)
            buf[bt] = dict[shift + bt];
        }
        for (; bt < end; ++bt)
          buf[bt] = buf[bt - dt];
      }
    }
    st.l = lm, st.p = lpos, st.b = bt, st.f = final;
    if (lm)
      final = 1, st.m = lbt, st.d = dm, st.n = dbt;
  } while (!final);
  return bt != buf.length && noBuf ? slc(buf, 0, bt) : buf.subarray(0, bt);
};
var et = /* @__PURE__ */ new u8(0);
var b2 = function(d, b) {
  return d[b] | d[b + 1] << 8;
};
var b4 = function(d, b) {
  return (d[b] | d[b + 1] << 8 | d[b + 2] << 16 | d[b + 3] << 24) >>> 0;
};
var b8 = function(d, b) {
  return b4(d, b) + b4(d, b + 4) * 4294967296;
};
function inflateSync(data, opts) {
  return inflt(data, { i: 2 }, opts && opts.out, opts && opts.dictionary);
}
var td = typeof TextDecoder != "undefined" && /* @__PURE__ */ new TextDecoder();
var tds = 0;
try {
  td.decode(et, { stream: true });
  tds = 1;
} catch (e) {
}
var dutf8 = function(d) {
  for (var r = "", i = 0; ; ) {
    var c = d[i++];
    var eb = (c > 127) + (c > 223) + (c > 239);
    if (i + eb > d.length)
      return { s: r, r: slc(d, i - 1) };
    if (!eb)
      r += String.fromCharCode(c);
    else if (eb == 3) {
      c = ((c & 15) << 18 | (d[i++] & 63) << 12 | (d[i++] & 63) << 6 | d[i++] & 63) - 65536, r += String.fromCharCode(55296 | c >> 10, 56320 | c & 1023);
    } else if (eb & 1)
      r += String.fromCharCode((c & 31) << 6 | d[i++] & 63);
    else
      r += String.fromCharCode((c & 15) << 12 | (d[i++] & 63) << 6 | d[i++] & 63);
  }
};
function strFromU8(dat, latin1) {
  if (latin1) {
    var r = "";
    for (var i = 0; i < dat.length; i += 16384)
      r += String.fromCharCode.apply(null, dat.subarray(i, i + 16384));
    return r;
  } else if (td) {
    return td.decode(dat);
  } else {
    var _a2 = dutf8(dat), s = _a2.s, r = _a2.r;
    if (r.length)
      err(8);
    return s;
  }
}
var slzh = function(d, b) {
  return b + 30 + b2(d, b + 26) + b2(d, b + 28);
};
var zh = function(d, b, z) {
  var fnl = b2(d, b + 28), fn = strFromU8(d.subarray(b + 46, b + 46 + fnl), !(b2(d, b + 8) & 2048)), es = b + 46 + fnl, bs = b4(d, b + 20);
  var _a2 = z && bs == 4294967295 ? z64e(d, es) : [bs, b4(d, b + 24), b4(d, b + 42)], sc = _a2[0], su = _a2[1], off = _a2[2];
  return [b2(d, b + 10), sc, su, fn, es + b2(d, b + 30) + b2(d, b + 32), off];
};
var z64e = function(d, b) {
  for (; b2(d, b) != 1; b += 4 + b2(d, b + 2))
    ;
  return [b8(d, b + 12), b8(d, b + 4), b8(d, b + 20)];
};
function unzipSync(data, opts) {
  var files = {};
  var e = data.length - 22;
  for (; b4(data, e) != 101010256; --e) {
    if (!e || data.length - e > 65558)
      err(13);
  }
  ;
  var c = b2(data, e + 8);
  if (!c)
    return {};
  var o = b4(data, e + 16);
  var z = o == 4294967295 || c == 65535;
  if (z) {
    var ze = b4(data, e - 12);
    z = b4(data, ze) == 101075792;
    if (z) {
      c = b4(data, ze + 32);
      o = b4(data, ze + 48);
    }
  }
  var fltr = opts && opts.filter;
  for (var i = 0; i < c; ++i) {
    var _a2 = zh(data, o, z), c_2 = _a2[0], sc = _a2[1], su = _a2[2], fn = _a2[3], no = _a2[4], off = _a2[5], b = slzh(data, off);
    o = no;
    if (!fltr || fltr({
      name: fn,
      size: sc,
      originalSize: su,
      compression: c_2
    })) {
      if (!c_2)
        files[fn] = slc(data, b, b + sc);
      else if (c_2 == 8)
        files[fn] = inflateSync(data.subarray(b, b + sc), { out: new u8(su) });
      else
        err(14, "unknown compression type " + c_2);
    }
  }
  return files;
}

// src/index.js
var name = "@penglai/office-reader";
var version = "0.1.2";
var inject = ["tools", "fs"];
var MAX_ARCHIVE_BYTES = 32 * 1024 * 1024;
var MAX_EXPANDED_BYTES = 64 * 1024 * 1024;
var MAX_ENTRY_BYTES = 16 * 1024 * 1024;
var MAX_ENTRIES = 4096;
var MAX_OUTPUT_CHARS = 1e5;
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
  return value.replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&quot;", '"').replaceAll("&apos;", "'").replaceAll("&amp;", "&").replace(/&#(\d+);/g, (_, decimal) => String.fromCodePoint(Number(decimal))).replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)));
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
  const floor = Math.max(0, bytes.byteLength - 65557);
  let eocd = -1;
  for (let at2 = bytes.byteLength - 22; at2 >= floor; at2 -= 1) {
    if (view.getUint32(at2, true) === 101010256) {
      eocd = at2;
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
    if (at + 46 > bytes.byteLength || view.getUint32(at, true) !== 33639248) {
      fail("ZIP central directory entry is invalid");
    }
    const uncompressed = view.getUint32(at + 24, true);
    const nameLength = view.getUint16(at + 28, true);
    const extraLength = view.getUint16(at + 30, true);
    const commentLength = view.getUint16(at + 32, true);
    const nameBytes = bytes.subarray(at + 46, at + 46 + nameLength);
    const entryName = new TextDecoder("utf-8", { fatal: true }).decode(nameBytes);
    if (!entryName || entryName.includes("\0") || entryName.startsWith("/") || entryName.startsWith("\\") || entryName.split(/[\\/]/).includes("..")) {
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
function naturalNumber(name2) {
  return Number(/(\d+)(?=\.xml$)/.exec(name2)?.[1] ?? Number.MAX_SAFE_INTEGER);
}
function extractDocx(files) {
  const names = Object.keys(files).filter((name2) => /^word\/(document|header\d*|footer\d*)\.xml$/.test(name2)).sort((a, b) => a === "word/document.xml" ? -1 : b === "word/document.xml" ? 1 : a.localeCompare(b));
  if (!names.includes("word/document.xml")) fail("DOCX document.xml is missing");
  const sections = names.map((file) => {
    const xml = decodeXml(files[file]);
    const paragraphs = [...xml.matchAll(/<w:p(?:\s[^>]*)?>([\s\S]*?)<\/w:p>/g)].map((match) => tagText(match[1], "w:t")).filter(Boolean);
    return { name: file, text: paragraphs.join("\n") };
  });
  return { format: "docx", sections };
}
function extractPptx(files) {
  const names = Object.keys(files).filter((name2) => /^ppt\/slides\/slide\d+\.xml$/.test(name2)).sort((a, b) => naturalNumber(a) - naturalNumber(b));
  if (!names.length) fail("PPTX slides are missing");
  const sections = names.map((file, index) => ({
    name: `Slide ${index + 1}`,
    text: tagText(decodeXml(files[file]), "a:t")
  }));
  return { format: "pptx", sections };
}
function extractXlsx(files) {
  const shared = files["xl/sharedStrings.xml"] ? [...decodeXml(files["xl/sharedStrings.xml"]).matchAll(/<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g)].map(
    (match) => tagText(match[1], "t")
  ) : [];
  const names = Object.keys(files).filter((name2) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name2)).sort((a, b) => naturalNumber(a) - naturalNumber(b));
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
function extractOfficeBytes(bytes, format) {
  if (!(bytes instanceof Uint8Array)) fail("input is not bytes");
  if (bytes.byteLength > MAX_ARCHIVE_BYTES) fail("Office file exceeds 32 MiB");
  const files = unzipOffice(bytes);
  if (format === "docx") return extractDocx(files);
  if (format === "xlsx") return extractXlsx(files);
  if (format === "pptx") return extractPptx(files);
  fail("supported extensions are .docx, .xlsx, and .pptx");
}
function capOutput(extracted) {
  const full = extracted.sections.filter((section) => section.text).map((section) => `## ${section.name}
${section.text}`).join("\n\n");
  const truncated = full.length > MAX_OUTPUT_CHARS;
  return {
    format: extracted.format,
    sections: extracted.sections.length,
    text: truncated ? full.slice(0, MAX_OUTPUT_CHARS) : full,
    truncated
  };
}
function apply(ctx) {
  ctx.tools.register({
    name: "penglai_office_extract",
    description: "Read text and cell values from one DOCX, XLSX, or PPTX file through the DSH filesystem. Read-only; does not preserve layout, execute macros, or calculate formulas.",
    parameters: {
      type: "object",
      additionalProperties: false,
      required: ["file_path"],
      properties: {
        file_path: {
          type: "string",
          description: "Path to a .docx, .xlsx, or .pptx file in the active workspace."
        }
      }
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
          truncated: { type: "boolean" }
        }
      },
      render: (_args, value) => [
        {
          type: "text",
          text: `[UNTRUSTED OFFICE FILE CONTENT]
${value.text}`
        }
      ],
      presentationMeta: (_args, value) => ({
        path: value.path,
        bytes: value.bytes,
        format: value.format,
        sections: value.sections,
        truncated: value.truncated
      })
    },
    async execute(args, exec) {
      if (!args || typeof args.file_path !== "string" || !args.file_path.trim()) {
        fail("file_path is required");
      }
      const format = extension(args.file_path);
      if (!(/* @__PURE__ */ new Set(["docx", "xlsx", "pptx"])).has(format)) {
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
        ...capOutput(extractOfficeBytes(bytes, format))
      };
    }
  });
  return { version, readOnly: true, formats: ["docx", "xlsx", "pptx"] };
}
Object.assign(apply, { inject });
var index_default = { name, version, inject, apply };
export {
  apply,
  index_default as default,
  extractOfficeBytes,
  inject,
  name,
  version
};
