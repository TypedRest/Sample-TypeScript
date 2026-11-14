import { defineConfig } from "vite";

// Forward API requests to the service started with "npm start"
const service = "http://localhost:3000";

export default defineConfig({
    server: {
        proxy: {
            "/contacts": service,
            "/openapi.yaml": service,
            "/scalar": service
        }
    }
});
