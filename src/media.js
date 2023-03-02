async function handleMedia(request, env, context) {
	const query = new URL(request.url).searchParams;
	const id = query.get('id');
	const object = await env.FAX_FILES.get(id);
	if (object == null) {
		return new Response('Not found', {status: 404});
	}
	return new Response(object.body, {status: 200});
}

export {handleMedia};
