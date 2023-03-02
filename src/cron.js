// Store fax data for 2 days.
const MAX_FAX_AGE_SECONDS = 60 * 60 * 24 * 2;

async function cleanup(env) {
	const now = Math.floor(Date.now() / 1000);
	const threshold = now - MAX_FAX_AGE_SECONDS;

	// R2 can delete 1-1000 files at once, so limit to 1000.
	const [{results}] = await env.FAX_DB.batch([
		env.FAX_DB.prepare('SELECT FaxID FROM Faxes WHERE Initiated < ? ORDER BY Initiated LIMIT 1000').bind(threshold),
		env.FAX_DB.prepare('DELETE FROM Faxes WHERE FaxID IN (SELECT FaxID FROM Faxes WHERE Initiated < ? ORDER BY Initiated LIMIT 1000)').bind(threshold)
	]);
	let ids = results.map(({FaxID}) => FaxID);
	if (ids.length > 0)	return env.FAX_FILES.delete(ids);
}

function handleCron(request, env, context) {
	context.waitUntil(cleanup(env));
	return new Response('OK', {status: 200});
}

export {handleCron};
