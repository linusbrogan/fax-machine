// Returns a promise that resolves to the given phone number in E.164 format or NULL if phoneNumber is not a valid US number.
async function normalizePhoneNumber(phoneNumber, env) {
	try {
		if (phoneNumber[0] != '+') phoneNumber = `+1${phoneNumber}`;
		const headers = {
			'Accept': 'application/json',
			'Authorization': `Bearer ${env.TELNYX_API_KEY}`
		}
		const lookup = await fetch(
			`https://api.telnyx.com/v2/number_lookup/${encodeURIComponent(phoneNumber)}`,
			{headers}
		);
		const {data} = await lookup.json();
		if (!data.valid_number || data.country_code != 'US') return null;
		return data.phone_number;
	} catch (e) {
		return null;
	}
}

function sendFax(to, mediaURL, env) {
	const body = JSON.stringify({
		command_id: new URL(mediaURL).searchParams.get('id'),
		connection_id: env.TELNYX_APP_ID,
		from: env.TELNYX_PHONE_NUMBER,
		media_url: mediaURL,
		to
	});

	return fetch('https://api.telnyx.com/v2/faxes', {
		method: 'POST',
		headers: {
			'Accept': 'application/json',
			'Authorization': `Bearer ${env.TELNYX_API_KEY}`,
			'Content-Type': 'application/json'
		},
		body
	});
}

function createFax(faxID, telnyxID, recipient, env) {
	const now = Math.floor(Date.now() / 1000);
	return env.FAX_DB
		.prepare('INSERT INTO Faxes (FaxID, TelnyxID, Recipient, Initiated, Updated) VALUES (?, ?, ?, ?, ?)')
		.bind(faxID, telnyxID, recipient, now, now)
		.run();
}

async function handleSend(request, env, context) {
	if (request.method != 'POST') {
		return new Response('Method not supported', {status: 405});
	}
	const body = await request.formData();
	if (!body.has('recipient')) {
		return new Response('Missing recipient', {status: 400});
	}
	if (!body.has('media')) {
		return new Response('Missing media', {status: 400});
	}

	const recipient = await normalizePhoneNumber(body.get('recipient'), env);
	if (recipient == null) return new Response('Invalid recipient', {status: 400});

	const uploadID = crypto.randomUUID();
	const media = body.get('media').stream();
	await env.FAX_FILES.put(uploadID, media);

	const fax = await sendFax(
		recipient,
		`${new URL(request.url).origin}/media?id=${uploadID}`,
		env
	);
	const faxMetadata = await fax.json();
	await createFax(uploadID, faxMetadata.data.id, recipient, env);

	const statusPage = `${new URL(request.url).origin}/status?id=${uploadID}`;
	return Response.redirect(statusPage, 303);
}

export {handleSend};
