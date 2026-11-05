// Worker entry. Only the default export lives here: workerd treats every
// named export of the entry module as an entrypoint. The logic is in app.ts.
import {handleRequest, handleScheduled} from './app';
import type {Env} from './env';

export default {
  fetch(request, env) {
    return handleRequest(request, env);
  },
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(handleScheduled(controller.cron, env, new Date(controller.scheduledTime)));
  },
} satisfies ExportedHandler<Env>;
