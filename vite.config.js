import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,

    // ✅ allow ngrok domain
    allowedHosts: [
      "coenobitic-talon-disbelievingly.ngrok-free.dev",
    ],
  },
});
