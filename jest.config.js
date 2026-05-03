/** @type {import('jest').Config} */
module.exports = {
    testEnvironment: "node",
    testMatch: ["<rootDir>/tests/**/*.test.ts"],
    transform: {
        "^.+\\.ts$": ["ts-jest", { tsconfig: "<rootDir>/tests/tsconfig.json" }]
    },
    moduleNameMapper: {
        "^@addressbook/dto$": "<rootDir>/dto/src",
        "^@addressbook/client$": "<rootDir>/client/src",
        "^@addressbook/server$": "<rootDir>/server/src"
    }
};
