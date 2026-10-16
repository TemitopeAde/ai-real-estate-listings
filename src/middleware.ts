import { defineMiddleware } from 'astro:middleware';
import { getSecret } from 'astro:env/server';
import { publishLifecycleSheetsEnv } from './backend/lifecycle-env-bridge';
import { publishDeepSeekApiKey } from './backend/deepseek-env-bridge';

// Lifecycle webhooks run backend event extensions that cannot read Astro env themselves.
export const onRequest = defineMiddleware((context, next) => {
  publishDeepSeekApiKey(getSecret('DEEPSEEK_API_KEY'));
  if (context.url.pathname.startsWith('/_wix/extensions/webhooks/')) {
    publishLifecycleSheetsEnv({
      LIFECYCLE_SHEETS_WEBHOOK_URL: getSecret('LIFECYCLE_SHEETS_WEBHOOK_URL'),
      LIFECYCLE_SHEETS_WEBHOOK_SECRET: getSecret('LIFECYCLE_SHEETS_WEBHOOK_SECRET'),
    });
  }
  return next();
});
