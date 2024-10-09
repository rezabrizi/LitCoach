import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import fs from "fs";
import path from "path";

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const manifestPath = path.resolve(__dirname, "./public/manifest.json");
const packageJsonPath = path.resolve(__dirname, "package.json");

const existingManifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

const manifest = {
    ...existingManifest,
    version: packageJson.version,
    description: packageJson.description,
};

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), crx({ manifest })],
    server: { port: 5173 },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});
