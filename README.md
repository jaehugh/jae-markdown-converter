# Markdown Converter

Privacy-first conversion of local documents into LLM-ready Markdown.

## Supported formats

- DOCX
- HTML
- JSON
- CSV
- XML
- TXT

Files are processed in the visitor's browser and are not uploaded or stored.
PDF conversion remains available through
[Document Parser](https://documents.johnhughesai.com).

## Upstream

Product direction and format coverage are adapted from
[microsoft/markitdown](https://github.com/microsoft/markitdown), licensed MIT.
This Cloudflare-compatible implementation is an independent browser-first
derivative and does not embed the upstream Python runtime.

## Commands

```powershell
npm install
npm test
npm run check
npm run build
npx wrangler deploy --dry-run
```

Production domain: `markdown.johnhughesai.com`
