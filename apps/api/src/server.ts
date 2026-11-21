import Fastify, { type FastifyInstance } from "fastify";

export function buildServer(): FastifyInstance {
  const server = Fastify();

  server.get("/healthz", async () => ({ status: "ok" }));

  return server;
}
