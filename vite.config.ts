import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  if (mode === "library") {
    // Library build configuration
    return {
      plugins: [react()],
      build: {
        lib: {
          entry: resolve(__dirname, "src/index.ts"),
          name: "ReactGraphTree",
          fileName: (format) => `index.${format === "es" ? "es." : ""}js`,
          formats: ["es", "cjs"],
        },
        rollupOptions: {
          external: ["react", "react-dom", "styled-components", "zustand"],
          output: {
            globals: {
              react: "React",
              "react-dom": "ReactDOM",
              "styled-components": "styled",
              zustand: "zustand",
            },
          },
        },
        sourcemap: true,
        minify: "terser",
        emptyOutDir: false,
      },
    };
  }

  // Development/preview configuration (default)
  return {
    plugins: [react()],
  };
});
