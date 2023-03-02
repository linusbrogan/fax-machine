import nacl from 'tweetnacl';
import util from 'tweetnacl-util';

// Returns a promise that resolves to a boolean indicating whether the webhook was properly signed and not older than 5 minutes.
async function verifyTelnyxWebhook(request, body, publicKey) {
	try {
		const signature = request.headers.get('telnyx-signature-ed25519');
		const timestamp = request.headers.get('telnyx-timestamp');
		const data = `${timestamp}|${body}`;
		const verified = nacl.sign.detached.verify(
			util.decodeUTF8(data),
			util.decodeBase64(signature),
			util.decodeBase64(publicKey)
		);

		if (verified) {
			const oldestAcceptableTimestamp = Date.now() / 1000 - 5 * 60;
			return Number(timestamp) >= oldestAcceptableTimestamp;
		}
	} catch (e) {}
	return false;
}

function setStatus(json, env) {
	const {payload} = json.data;
	const id = new URL(payload.original_media_url).searchParams.get('id');
	const telnyxID = payload.fax_id;
	const status = payload.status;
	const timestamp = Math.floor(new Date(json.data.occurred_at).getTime() / 1000);

	return env.FAX_DB
		.prepare('UPDATE Faxes SET TelnyxID = ?, Status = ?, Updated = ? WHERE FaxID = ? AND Updated < ? AND (TelnyxID = ? OR TelnyxID IS NULL)')
		.bind(telnyxID, status, timestamp, id, timestamp, telnyxID)
		.all();
}

function processWebhook(request, body, env, context) {
	const json = JSON.parse(body);
	if (json.data.event_type.substring(0, 3) == 'fax' && json.data.payload.direction == 'outbound') {
		return setStatus(json, env);
	}
}

async function handleWebhook(request, env, context) {
	const body = await request.text();
	console.log(env.TELNYX_PUBLIC_KEY);
	const verified = await verifyTelnyxWebhook(request, body, env.TELNYX_PUBLIC_KEY);
	if (verified) {
		context.waitUntil(processWebhook(request, body, env, context));
	}
	return new Response('Webhook accepted', {status: 200});
}

export {handleWebhook};
