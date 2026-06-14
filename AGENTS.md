# Agent Guide

## Purpose

Maintain Markdown Converter at `markdown.johnhughesai.com`.

## Rules

- Keep document content in the browser.
- Never add uploads, persistence, analytics containing content, or remote URL fetching without explicit approval.
- Preserve MIT attribution to `microsoft/markitdown`.
- Describe this as a browser-first derivative, not the complete upstream Python package.
- Run tests, syntax checks, and the production build before deployment.
- Verify `/health` and `/api/capabilities` after deployment.
- Never commit secrets.
