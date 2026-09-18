import test from "node:test";
import assert from "node:assert/strict";
import { csvToMarkdown, jsonToMarkdown, routeRequest } from "../src/index.js";

test("converts CSV rows to a Markdown table", () => {
  assert.equal(
    csvToMarkdown('name,score\n"Ada, L.",10\nGrace,9'),
    "| name | score |\n| --- | --- |\n| Ada, L. | 10 |\n| Grace | 9 |"
  );
});

test("converts nested JSON into readable Markdown", () => {
  const output = jsonToMarkdown({ project: "Jae AI", tags: ["tools", "research"] });
  assert.match(output, /## project/);
  assert.match(output, /Jae AI/);
  assert.match(output, /- tools/);
});

test("health and capabilities routes are available", async () => {
  const health = await routeRequest(new Request("https://example.com/health"));
  assert.equal(health.status, 200);
  assert.equal((await health.json()).service, "jae-markdown-converter");

  const capabilities = await routeRequest(new Request("https://example.com/api/capabilities"));
  const body = await capabilities.json();
  assert.equal(body.privacy.processing, "browser_only");
  assert.equal(body.limits.file_bytes, null);
  assert.ok(body.inputs.includes("pdf"));
});

test("the browser accepts PDFs without a fixed byte rejection", async () => {
  const response = await routeRequest(new Request("https://example.com/"));
  const html = await response.text();
  assert.match(html, /No fixed file-size limit/);
  assert.match(html, /pdfMarkdown\(await file\.arrayBuffer\(\)\)/);
  assert.doesNotMatch(html, /MAX_BYTES|10 MB limit/);
});

test("unsupported methods are rejected", async () => {
  const response = await routeRequest(new Request("https://example.com/", { method: "POST" }));
  assert.equal(response.status, 405);
});
