import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@microsoft/power-apps/data": path.resolve(__dirname, "./src/lib/mocks/powerAppsMock.ts"),
      "@microsoft/power-apps": path.resolve(__dirname, "./src/lib/mocks/powerAppsMock.ts"),
    },
  },
})
