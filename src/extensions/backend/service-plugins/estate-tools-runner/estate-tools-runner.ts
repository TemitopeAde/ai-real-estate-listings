import { toolsProvider } from '@wix/app-tools/service-plugins';
import { runAppTool } from '../../../../lib/server/app-tools';

toolsProvider.provideHandlers({
  runTool: async ({ request }) => {
    const methodName = request.methodName ?? '';
    const payload = request.payload && typeof request.payload === 'object' ? request.payload : {};
    return { response: await runAppTool(methodName, payload) };
  },
});
