import react from "@vitejs/plugin-react"
import path from "node:path"
import { defineConfig } from "vitest/config"

const alias = { "@": path.resolve(import.meta.dirname, "./src") }

export default defineConfig({
  test: {
    projects: [
      {
        plugins: [react()],
        resolve: { alias },
        test: {
          name: "client",
          environment: "jsdom",
          setupFiles: ["./src/test/setup.ts"],
          include: ["src/**/*.test.{ts,tsx}"],
          css: false,
        },
      },
      {
        test: {
          name: "server",
          environment: "node",
          include: ["server/**/*.test.ts"],
        },
      },
    ],
    coverage: {
      provider: "v8",
      include: ["src/domain/**", "src/components/**", "src/app/**", "src/stores/**", "server/**"],
      exclude: ["**/*.test.*", "server/db/migrate.ts", "server/index.ts"],
      reporter: ["text-summary", "html"],
    },
  },
})
