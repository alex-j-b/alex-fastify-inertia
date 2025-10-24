import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import { defineConfig, Inertia, type InertiaConfig } from "node-inertiajs";
import { ViteDevServer, createServer as createViteServer } from "vite";
import { FastifyAdapter } from "./fastify_adapter.js";

export { FastifyAdapter } from "./fastify_adapter.js";

declare module "fastify" {
  interface FastifyReply {
    inertia: InstanceType<typeof Inertia>;
  }
}

export default fp<InertiaConfig>(async function inertiaPlugin(
  fastify: FastifyInstance,
  opts: InertiaConfig
) {
  if (!opts) {
    throw new Error("Inertia.js configuration is required");
  }

  const config = defineConfig(opts);

  let vite: ViteDevServer | undefined;

  if (process.env.NODE_ENV !== "production") {
    vite = await createViteServer(config.vite as any);

    fastify.addHook("onRequest", (request, reply, done) => {
      vite!.middlewares(request.raw, reply.raw, done);
    });
  }

  // Add Inertia instance to reply
  fastify.addHook("onRequest", (request, reply, done) => {
    const adapter = new FastifyAdapter(request, reply);
    reply.inertia = new Inertia(adapter, config, vite as any);
    done();
  });
});
