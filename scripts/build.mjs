import { copyFile, mkdir, writeFile } from "node:fs/promises";

await mkdir("dist", { recursive: true });
await copyFile("src/index.js", "dist/_worker.js");
await writeFile("dist/README.txt", "Cloudflare Worker build output.\n", "utf8");
