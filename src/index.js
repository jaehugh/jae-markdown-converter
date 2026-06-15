const VERSION = "0.1.0";
const UPSTREAM = "https://github.com/microsoft/markitdown";
const REPOSITORY = "https://github.com/jaehugh/jae-markdown-converter";

const SECURITY_HEADERS = {
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
    "connect-src 'self' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "object-src 'none'",
    "worker-src 'self' blob: https://cdn.jsdelivr.net",
    "base-uri 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'"
  ].join("; "),
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY"
};

function escapeCell(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>");
}

export function parseCsv(input) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

export function csvToMarkdown(input) {
  const rows = parseCsv(input);
  if (!rows.length) return "";
  const width = Math.max(...rows.map((row) => row.length));
  const normalized = rows.map((row) => Array.from({ length: width }, (_, index) => escapeCell(row[index])));
  const header = normalized[0];
  return [
    `| ${header.join(" | ")} |`,
    `| ${header.map(() => "---").join(" | ")} |`,
    ...normalized.slice(1).map((row) => `| ${row.join(" | ")} |`)
  ].join("\n");
}

function renderJsonValue(value, depth = 2) {
  if (value === null) return "null";
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (item && typeof item === "object") {
        return `-\n${renderJsonValue(item, depth + 1).split("\n").map((line) => `  ${line}`).join("\n")}`;
      }
      return `- ${String(item)}`;
    }).join("\n");
  }
  if (typeof value === "object") {
    return Object.entries(value).map(([key, item]) => {
      const heading = `${"#".repeat(Math.min(depth, 6))} ${key}`;
      return `${heading}\n\n${renderJsonValue(item, depth + 1)}`;
    }).join("\n\n");
  }
  return String(value);
}

export function jsonToMarkdown(value) {
  return renderJsonValue(value);
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      ...SECURITY_HEADERS,
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}

export function routeRequest(request) {
  const url = new URL(request.url);
  if (!["GET", "HEAD"].includes(request.method)) {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }
  if (url.pathname === "/health") {
    return jsonResponse({ status: "ok", service: "jae-markdown-converter", version: VERSION });
  }
  if (url.pathname === "/api/capabilities") {
    return jsonResponse({
      service: "jae-markdown-converter",
      version: VERSION,
      privacy: { processing: "browser_only", file_upload: false, persistence: false },
      limits: { file_bytes: 10485760 },
      inputs: ["pdf", "docx", "html", "json", "csv", "xml", "txt"],
      outputs: ["markdown"],
      related: { pdf: "https://documents.johnhughesai.com" },
      upstream: UPSTREAM
    });
  }
  if (!["/", "/index.html"].includes(url.pathname)) {
    return jsonResponse({ error: "not_found" }, 404);
  }
  return new Response(request.method === "HEAD" ? null : HTML, {
    headers: {
      ...SECURITY_HEADERS,
      "Cache-Control": "public, max-age=300",
      "Content-Type": "text/html; charset=utf-8"
    }
  });
}

export default { fetch: routeRequest };

const HTML = String.raw`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="description" content="Convert local documents into clean, AI-ready Markdown without uploading them.">
  <title>Markdown Converter | Jae Hugh AI Lab</title>
  <style>
    :root{--paper:#f2efe7;--ink:#15191b;--muted:#66706d;--line:#cbd0c8;--lime:#b8f542;--dark:#101719;--white:#fffefa}
    *{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.5 Georgia,serif}
    a{color:inherit}.shell{width:min(1180px,calc(100% - 32px));margin:auto}header{display:flex;justify-content:space-between;align-items:center;padding:22px 0;border-bottom:1px solid var(--line)}
    .brand{font:700 14px/1.2 Arial,sans-serif;text-decoration:none;letter-spacing:.03em}.brand small{display:block;color:var(--muted);font-weight:400;margin-top:4px}
    nav{display:flex;gap:18px;font:13px Arial,sans-serif;color:var(--muted)}nav a{text-decoration:none}
    main{padding:66px 0 54px}.hero{display:grid;grid-template-columns:1.2fr .8fr;gap:50px;align-items:end;padding-bottom:48px;border-bottom:1px solid var(--line)}
    .eyebrow{font:800 12px Arial,sans-serif;text-transform:uppercase;letter-spacing:.18em;color:#426000}h1{font-size:clamp(3.6rem,8vw,7.4rem);line-height:.85;letter-spacing:-.075em;margin:14px 0 0}
    .lead{font-size:1.2rem;color:var(--muted);max-width:38ch;margin:0}.privacy{display:inline-flex;margin-top:22px;padding:8px 12px;border:1px solid var(--line);border-radius:999px;font:700 12px Arial,sans-serif}
    .work{display:grid;grid-template-columns:.72fr 1.28fr;min-height:520px;border-bottom:1px solid var(--line)}.input{padding:28px 28px 28px 0;border-right:1px solid var(--line)}
    .drop{display:grid;place-items:center;text-align:center;min-height:270px;padding:30px;border:2px dashed #718078;background:rgba(255,255,255,.35);cursor:pointer}.drop.drag{background:#e8f7c9;border-color:#426000}
    .drop input{position:absolute;opacity:0}.drop b{font-size:1.35rem}.drop span{display:block;color:var(--muted);margin-top:8px}.types{display:flex;flex-wrap:wrap;gap:7px;margin-top:16px}.types span{padding:6px 9px;background:var(--dark);color:var(--white);font:700 11px Arial,sans-serif}
    .status{min-height:24px;color:var(--muted);font:13px Arial,sans-serif}.output{padding:28px 0 28px 28px;display:flex;flex-direction:column}.bar{display:flex;gap:8px;align-items:center;margin-bottom:14px;flex-wrap:wrap}
    button{border:1px solid var(--ink);background:transparent;padding:9px 12px;font:700 12px Arial,sans-serif;cursor:pointer}button.primary{background:var(--lime);margin-left:auto}button:disabled{opacity:.35;cursor:not-allowed}
    textarea{flex:1;min-height:420px;width:100%;resize:vertical;border:0;background:var(--dark);color:#e9eee9;padding:22px;font:13px/1.65 Consolas,monospace;outline:none}
    .details{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--line)}.details article{background:var(--paper);padding:24px}.details h2{font-size:1rem;margin:0 0 7px;font-family:Arial,sans-serif}.details p{margin:0;color:var(--muted);font-size:.9rem}
    footer{display:flex;justify-content:space-between;gap:20px;padding:28px 0 40px;color:var(--muted);font:12px Arial,sans-serif;flex-wrap:wrap}
    @media(max-width:800px){.hero,.work{grid-template-columns:1fr}.input{border-right:0;padding-right:0}.output{padding-left:0}.details{grid-template-columns:1fr}nav{display:none}}
  </style>
</head>
<body><div class="shell">
  <header><a class="brand" href="https://johnhughesai.com">JAE HUGH AI LAB<small>Markdown Converter</small></a><nav><a href="/api/capabilities">Capabilities</a><a href="${UPSTREAM}">Upstream</a><a href="${REPOSITORY}">GitHub</a></nav></header>
  <main>
    <section class="hero"><div><p class="eyebrow">Local document conversion</p><h1>Clean files.<br>Useful context.</h1></div><div><p class="lead">Turn common document formats into structured Markdown for AI, notes, search, and knowledge systems.</p><span class="privacy">Your file stays in this browser</span></div></section>
    <section class="work">
      <div class="input"><label class="drop" id="drop"><input id="file" type="file" accept=".pdf,.docx,.html,.htm,.json,.csv,.xml,.txt,application/pdf,text/*"><div><b>Drop a document here</b><span>or choose a local file</span></div></label><div class="types"><span>PDF</span><span>DOCX</span><span>HTML</span><span>JSON</span><span>CSV</span><span>XML</span><span>TXT</span></div><p class="status" id="status">Ready. Maximum file size: 10 MB.</p></div>
      <div class="output"><div class="bar"><button id="clear" disabled>Clear</button><button id="download" disabled>Download .md</button><button class="primary" id="copy" disabled>Copy Markdown</button></div><textarea id="output" spellcheck="false" placeholder="Converted Markdown will appear here."></textarea></div>
    </section>
    <section class="details"><article><h2>Private by default</h2><p>Conversion runs locally. No document content is sent to the Worker.</p></article><article><h2>AI-ready structure</h2><p>Headings, lists, tables, and links stay readable for models and humans.</p></article><article><h2>PDF support</h2><p>PDF text is extracted locally in your browser. For scanned or image-only PDFs that need OCR, use the dedicated <a href="https://documents.johnhughesai.com">Document Parser</a>.</p></article></section>
  </main>
  <footer><span>Inspired by <a href="${UPSTREAM}">Microsoft MarkItDown</a> under MIT.</span><span>Browser-first Cloudflare adaptation by Jae Hugh.</span></footer>
</div>
<script type="module">
  const MAX_BYTES=10*1024*1024,drop=document.querySelector("#drop"),fileInput=document.querySelector("#file"),status=document.querySelector("#status"),output=document.querySelector("#output"),copy=document.querySelector("#copy"),download=document.querySelector("#download"),clear=document.querySelector("#clear");
  let name="document";
  function message(text,error=false){status.textContent=text;status.style.color=error?"#a32727":""}
  function enabled(value){copy.disabled=!value;download.disabled=!value;clear.disabled=!value}
  function escapeCell(value){return String(value??"").replaceAll("|","\\\\|").replace(/\\r?\\n/g,"<br>")}
  function parseCsv(input){const rows=[];let row=[],cell="",quoted=false;for(let i=0;i<input.length;i++){const c=input[i],n=input[i+1];if(c==='"'&&quoted&&n==='"'){cell+='"';i++}else if(c==='"'){quoted=!quoted}else if(c===","&&!quoted){row.push(cell.trim());cell=""}else if((c==="\\n"||c==="\\r")&&!quoted){if(c==="\\r"&&n==="\\n")i++;row.push(cell.trim());if(row.some(Boolean))rows.push(row);row=[];cell=""}else cell+=c}row.push(cell.trim());if(row.some(Boolean))rows.push(row);return rows}
  function csvMarkdown(input){const rows=parseCsv(input);if(!rows.length)return"";const width=Math.max(...rows.map(r=>r.length)),all=rows.map(r=>Array.from({length:width},(_,i)=>escapeCell(r[i]))),head=all[0];return["| "+head.join(" | ")+" |","| "+head.map(()=> "---").join(" | ")+" |",...all.slice(1).map(r=>"| "+r.join(" | ")+" |")].join("\\n")}
  function jsonValue(value,depth=2){if(value===null)return"null";if(Array.isArray(value))return value.map(item=>item&&typeof item==="object"?"-\\n"+jsonValue(item,depth+1).split("\\n").map(line=>"  "+line).join("\\n"):"- "+String(item)).join("\\n");if(typeof value==="object")return Object.entries(value).map(([key,item])=>"#".repeat(Math.min(depth,6))+" "+key+"\\n\\n"+jsonValue(item,depth+1)).join("\\n\\n");return String(value)}
  function xmlMarkdown(doc){function walk(node,depth=2){const children=[...node.children];const text=[...node.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent.trim()).filter(Boolean).join(" ");const title="#".repeat(Math.min(depth,6))+" "+node.tagName;return [title,text,...children.map(child=>walk(child,depth+1))].filter(Boolean).join("\\n\\n")}return walk(doc.documentElement)}
  async function htmlMarkdown(html){const {default:TurndownService}=await import("https://cdn.jsdelivr.net/npm/turndown@7.2.0/+esm");return new TurndownService({headingStyle:"atx",bulletListMarker:"-"}).turndown(html)}
  async function pdfMarkdown(buffer){const pdfjs=await import("https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs");pdfjs.GlobalWorkerOptions.workerSrc="https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";const doc=await pdfjs.getDocument({data:buffer,cMapUrl:"https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/",cMapPacked:true}).promise;const pages=[];for(let p=1;p<=doc.numPages;p++){const page=await doc.getPage(p);const content=await page.getTextContent();const lines=[];let line="";for(const item of content.items){if(typeof item.str!=="string")continue;line+=item.str;if(item.hasEOL){lines.push(line);line=""}else line+=" "}if(line.trim())lines.push(line);pages.push(lines.join("\n").replace(/[ \t]+\n/g,"\n").replace(/\n{3,}/g,"\n\n").trim())}await doc.destroy();return pages.filter(Boolean).join("\n\n---\n\n").trim()}
  async function convert(file){if(file.size>MAX_BYTES)return message("This file exceeds the 10 MB limit.",true);name=file.name.replace(/\\.[^.]+$/,"")||"document";message('Converting "'+file.name+'" locally...');enabled(false);try{const ext=file.name.split(".").pop().toLowerCase();let result;if(ext==="docx"){const mammoth=await import("https://cdn.jsdelivr.net/npm/mammoth@1.10.0/+esm");const html=(await mammoth.convertToHtml({arrayBuffer:await file.arrayBuffer()})).value;result=await htmlMarkdown(html)}else if(ext==="pdf"){result=await pdfMarkdown(await file.arrayBuffer())}else{const text=await file.text();if(["html","htm"].includes(ext))result=await htmlMarkdown(text);else if(ext==="json")result=jsonValue(JSON.parse(text));else if(ext==="csv")result=csvMarkdown(text);else if(ext==="xml"){const doc=new DOMParser().parseFromString(text,"application/xml");if(doc.querySelector("parsererror"))throw new Error("Invalid XML");result=xmlMarkdown(doc)}else result=text}output.value=result.trim();enabled(Boolean(output.value));message("Conversion complete. Nothing was uploaded.")}catch(error){console.error(error);message("Could not convert this file. Check that it is valid and supported.",true)}}
  drop.ondragover=e=>{e.preventDefault();drop.classList.add("drag")};drop.ondragleave=()=>drop.classList.remove("drag");drop.ondrop=e=>{e.preventDefault();drop.classList.remove("drag");if(e.dataTransfer.files[0])convert(e.dataTransfer.files[0])};fileInput.onchange=e=>e.target.files[0]&&convert(e.target.files[0]);
  clear.onclick=()=>{output.value="";fileInput.value="";enabled(false);message("Ready. Maximum file size: 10 MB.")};copy.onclick=async()=>{await navigator.clipboard.writeText(output.value);copy.textContent="Copied";setTimeout(()=>copy.textContent="Copy Markdown",1000)};download.onclick=()=>{const url=URL.createObjectURL(new Blob([output.value],{type:"text/markdown"})),a=document.createElement("a");a.href=url;a.download=name+".md";a.click();URL.revokeObjectURL(url)}
</script></body></html>`;
