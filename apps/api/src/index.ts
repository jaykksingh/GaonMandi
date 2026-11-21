import { buildServer } from "./server.js";

const server = buildServer();
const port = Number(process.env.API_PORT ?? 4000);

if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error("API_PORT must be an integer between 1 and 65535.");
}

await server.listen({ host: "0.0.0.0", port });
