import { coverageConfigDefaults, defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",
        poolOptions: {
            forks: {
                singleFork: true,
            },
        },
        coverage: {
            enabled: true,
            exclude: ["**/swagger/**", ...coverageConfigDefaults.exclude],
        },
    },
});
