import assert from "node:assert/strict";
import test from "node:test";
import { Context } from "@deepseek-ai/cordis";
import { ToolRuntime } from "@deepseek-ai/dsh-tools";
import { zipSync, strToU8 } from "fflate";
import { apply, extractOfficeBytes } from "../index.js";

function officeZip(files) {
  return zipSync(Object.fromEntries(Object.entries(files).map(([name, value]) => [name, strToU8(value)])));
}

test("extracts DOCX paragraphs without executing or writing", () => {
  const bytes = officeZip({
    "[Content_Types].xml": "<Types/>",
    "word/document.xml":
      '<w:document><w:body><w:p><w:r><w:t>Hello &amp; 蓬莱</w:t></w:r></w:p><w:p><w:r><w:t>Second</w:t></w:r></w:p></w:body></w:document>',
  });
  const out = extractOfficeBytes(bytes, "docx");
  assert.equal(out.format, "docx");
  assert.match(out.sections[0].text, /Hello & 蓬莱\nSecond/);
});

test("extracts XLSX shared strings, inline strings, values, and formulas", () => {
  const bytes = officeZip({
    "[Content_Types].xml": "<Types/>",
    "xl/sharedStrings.xml": "<sst><si><t>Name</t></si><si><t>Penglai</t></si></sst>",
    "xl/worksheets/sheet1.xml":
      '<worksheet><sheetData><row><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="C1"><f>1+1</f><v>2</v></c><c r="D1" t="inlineStr"><is><t>本地</t></is></c></row></sheetData></worksheet>',
  });
  const out = extractOfficeBytes(bytes, "xlsx");
  assert.match(out.sections[0].text, /A1: Name/);
  assert.match(out.sections[0].text, /B1: Penglai/);
  assert.match(out.sections[0].text, /C1: =1\+1 -> 2/);
  assert.match(out.sections[0].text, /D1: 本地/);
});

test("extracts PPTX slides in numeric order", () => {
  const bytes = officeZip({
    "[Content_Types].xml": "<Types/>",
    "ppt/slides/slide10.xml": "<p:sld><a:t>Ten</a:t></p:sld>",
    "ppt/slides/slide2.xml": "<p:sld><a:t>Two</a:t></p:sld>",
  });
  const out = extractOfficeBytes(bytes, "pptx");
  assert.deepEqual(out.sections.map((section) => section.text), ["Two", "Ten"]);
});

test("tool reads through ctx.fs with a hard byte cap", async () => {
  const bytes = officeZip({
    "[Content_Types].xml": "<Types/>",
    "word/document.xml": "<w:document><w:p><w:t>Office ready</w:t></w:p></w:document>",
  });
  let tool;
  let observedCap = 0;
  const ctx = {
    tools: { register(value) { tool = value; } },
    fs: {
      async resolve(path) { return { targetKey: path, displayPath: path }; },
      async stat() { return { type: "file", size: bytes.byteLength }; },
      async readBytes(_target, _signal, maxBytes) { observedCap = maxBytes; return bytes; },
    },
  };
  const state = apply(ctx);
  const out = await tool.execute({ file_path: "报告.docx" }, {});
  assert.equal(state.readOnly, true);
  assert.equal(observedCap, 32 * 1024 * 1024);
  assert.match(out.text, /Office ready/);
});

test("registers and executes through the exact DSH rc.1 ToolRuntime output contract", async () => {
  const bytes = officeZip({
    "[Content_Types].xml": "<Types/>",
    "word/document.xml": "<w:document><w:p><w:t>DSH rc.1 ready</w:t></w:p></w:document>",
  });
  class SystemPromptStub {
    tools() { return []; }
  }
  const app = new Context();
  app.provide("systemPrompt", new SystemPromptStub(), true);
  const tools = new ToolRuntime(app);
  apply({
    tools,
    fs: {
      async resolve(path) { return { targetKey: path, displayPath: path }; },
      async stat() { return { type: "file", size: bytes.byteLength }; },
      async readBytes() { return bytes; },
    },
  });
  const wireSchema = tools.schemas().find((schema) => schema.name === "penglai_office_extract");
  assert.ok(wireSchema);
  assert.deepEqual(wireSchema.parameters.required, ["file_path"]);
  assert.equal(wireSchema.parameters.properties.file_path.required, undefined);
  const result = await tools.execute({
    callId: "office-rc1",
    name: "penglai_office_extract",
    arguments: { file_path: "fixture.docx" },
    agent: { id: "office-test-agent" },
    signal: new AbortController().signal,
  });
  assert.equal(result.isError, false);
  assert.equal(result.value.format, "docx");
  assert.match(result.value.text, /DSH rc\.1 ready/);
  assert.match(result.content[0].text, /^\[UNTRUSTED OFFICE FILE CONTENT\]/);
  assert.equal(result.meta.format, "docx");
});

test("rejects unsafe ZIP paths and unsupported formats", () => {
  const unsafe = officeZip({ "../word/document.xml": "<w:t>bad</w:t>" });
  assert.throws(() => extractOfficeBytes(unsafe, "docx"), /unsafe/);
  const safe = officeZip({ "word/document.xml": "<w:t>ok</w:t>" });
  assert.throws(() => extractOfficeBytes(safe, "pdf"), /supported extensions/);
});
