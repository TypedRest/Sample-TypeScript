import Fastify, { type FastifyError, type FastifyInstance, type FastifyServerOptions } from "fastify";
import { NotFoundError, type ContactsService } from "./contacts.service";
import { registerContactsRoutes } from "./contacts.routes";

export interface BuildAppOptions extends FastifyServerOptions {
    service: ContactsService;
}

/**
 * Builds the Fastify app with the given {@link ContactsService} injected.
 * Allows tests to swap in a mock service.
 */
export function buildApp({ service, ...fastifyOpts }: BuildAppOptions): FastifyInstance {
    const app = Fastify(fastifyOpts);

    app.setErrorHandler((error: FastifyError, _req, reply) => {
        if (error instanceof NotFoundError) {
            return reply.code(404).send({ message: error.message });
        }
        if (error.validation) {
            return reply.code(400).send({ message: error.message });
        }
        reply.send(error);
    });

    registerContactsRoutes(app, service);

    return app;
}
