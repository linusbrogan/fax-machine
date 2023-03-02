import {handleCron} from './cron.js';
import {handleMedia} from './media.js';
import {handleSend} from './send.js';
import {handleStaticPage} from './static.js'
import {handleStatus} from './status.js';
import {handleWebhook} from './webhook.js';

export default {
	async fetch(request, env, context) {
		const path = new URL(request.url).pathname;
		switch (path) {
			case '/cron':
				return handleCron(request, env, context);
			case '/media':
				return handleMedia(request, env, context);
			case '/send':
				return handleSend(request, env, context);
			case '/status':
				return handleStatus(request, env, context);
			case '/webhook':
				return handleWebhook(request, env, context);
			default:
				return handleStaticPage(path);
		}
	}
};
