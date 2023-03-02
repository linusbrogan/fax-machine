# Fax Machine
Do you ever need to send a fax?
No?
Neither do I.
But if you do, it sure is a hassle.
Who has a fax machine these days?
Well, here is a virtual fax machine, built with Telnyx and Cloudflare Workers.

# Routes
Here are the important paths that the Worker serves:
- Send a fax at `/`.
- Trigger a database cleanup at `/cron`.
- Telnyx will send status updates to `/webhook`

# Setup
## Telnyx
- Save your API key and public key for later.
- [Create](https://portal.telnyx.com/#/app/call-control/fax/new) a Fax API Application.
	- Set the webhook URL to your Cloudflare Worker's URL (`https://fax-machine.[your-subdomain].workers.dev/webhook`).
	- Enter your email address to receive faxes.
	- Save the app, and then copy its App ID for later.
- Assign the fax application to your Telnyx phone number.

## Cloudflare
- Create a bucket in R2 called `fax-machine`.
- Create a database in D1 called `fax-machine`.
	- Copy its database ID for later.
	- Run `npx wrangler d1 execute fax-machine --file=./database.sql` to create the `Faxes` table.
		- Note: this command will delete the `Faxes` table if it already exists.
- Set the environment variables and enter your database ID in `wrangler.toml`.
	- Alternatively configure them as secrets with `npx wrangler secret put <key>`.
- Publish the Worker with `npx wrangler publish`.

### Bonus: Access Control
By default, this Worker lets anyone send faxes.
We can use Cloudflare Access to restrict who can send faxes:
- Configure a custom domain for your Worker.
	- Disable the `fax-machine.[your-subdomain].workers.dev` route, so the Fax Machine is only accessible through the custom domain.
- Create an Access application for your custom domain with your desired access controls.
- Create another Access application for the `/media` path with a Bypass policy to allow anyone to fetch media.
	- This allows Telnyx to retrieve the fax PDFs.
