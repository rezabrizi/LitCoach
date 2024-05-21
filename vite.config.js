import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import fs from "fs";
import path from "path";

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf-8"));

const manifestPath = path.resolve(__dirname, "./public/manifest.json");
const packageJsonPath = path.resolve(__dirname, "package.json");

const existingManifest = readJson(manifestPath);
const { version, description } = readJson(packageJsonPath);

const dynamicManifest = { ...existingManifest, version, description };

export default defineConfig({
    plugins: [react(), crx({ manifest: dynamicManifest })],
    server: { port: 5173 },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});
