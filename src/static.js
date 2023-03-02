import index from '../static/index.html';
import css from '../static/style.css';
import icon from '../static/fax.png';

const pages = new Map();
pages.set('/', {
	body: index,
	contentType: 'text/html'
});
pages.set('/style.css', {
	body: css,
	contentType: 'text/css'
});
pages.set('/favicon.ico', {
	body: icon,
	contentType: 'image/png'
});

function handleStaticPage(path) {
	if (!pages.has(path)) {
		return new Response('Not found', {status: 404});
	}
	const {
		body,
		contentType
	} = pages.get(path);
	return new Response(body, {
		status: 200,
		headers: {
			'Content-Type': contentType
		}
	});
}

export {handleStaticPage};
