import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  ssgOptions: {
    script: "async",
    formatting: "minify",
    crittersOptions: false,
  },
});
