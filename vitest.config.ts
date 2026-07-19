import { defineConfig } from "vitest/config";

// Scoped to the ported Calibration Gym pure-core tests. These are pure
// functions (no DOM), so a node environment is sufficient and fast.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/lib/calibrationGym/**/*.test.ts"],
  },
});
