function statusText(status) {
	if (status == 'failed') return 'failed';
	if (status == 'delivered') return 'was delivered';
	return 'is sending';
}

function statusPage(fax) {
	const {
		media_url,
		status,
		to
	} = fax.data;
	const html =
`<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<title>Fax status</title>
		<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
		<link href="style.css" rel="stylesheet">
	</head>
	<body>
		<header>
			<h1>
				<span class="material-icons">fax</span>
				<span>Fax Machine</span>
			</h1>
		</header>
		<div class="wrapper">
			<div class="card-container">
				<div class="card">
					<h2>Fax status</h2>
					<p>Your <a href="${media_url}">fax</a> to ${to} ${statusText(status)}.</p>
				</div>
			</div>
		</div>
	</body>
</html>
`

	const options = {
		status: 200,
		headers: {
			'Content-Type': 'text/html'
		}
	};
	return new Response(html, options);
}

async function handleStatus(request, env, context) {
	const query = new URL(request.url).searchParams;
	const id = query.get('id');
	const fax = await env.FAX_DB
		.prepare('SELECT * FROM Faxes WHERE FaxID = ? LIMIT 1')
		.bind(id)
		.first();
	if (fax == null) return new Response('Not found', {status: 404});
	const telnyxFax = await fetch(`https://api.telnyx.com/v2/faxes/${fax.TelnyxID}`, {
		headers: {
			'Accept': 'application/json',
			'Authorization': `Bearer ${env.TELNYX_API_KEY}`,
		}
	});
	if (!telnyxFax.ok) return new Response('Failed to check fax status', {status: 500});
	return statusPage(await telnyxFax.json());
}

export {handleStatus};
