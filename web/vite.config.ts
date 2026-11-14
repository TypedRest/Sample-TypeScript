import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

// Forward API requests to the service started with "npm start"
const service = "http://localhost:3000";

export default defineConfig({
    plugins: [solid()],
    server: {
        proxy: {
            "/contacts": service,
            "/openapi.yaml": service,
            "/scalar": service
        }
    }
});
