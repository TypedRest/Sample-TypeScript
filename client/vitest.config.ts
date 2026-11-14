import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        setupFiles: ["./vitest.setup.ts"],
        // fetchMock.resetMocks() does not clear pending mockOnceIf() predicates, so reset all mocks between tests
        mockReset: true
    }
});
