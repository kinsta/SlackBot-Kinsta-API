const { App } = require('@slack/bolt');
require('dotenv').config();

// Initialization
const app = new App({
	token: process.env.SLACK_BOT_TOKEN,
	signingSecret: process.env.SLACK_SIGNING_SECRET,
	socketMode: true, // enable the following to use socket mode
	appToken: process.env.APP_TOKEN,
});

const KinstaAPIUrl = 'https://api.kinsta.com/v2';

const headers = {
	Authorization: `Bearer ${process.env.KINSTA_API_KEY}`,
};

async function getAllSites() {
	const query = new URLSearchParams({
		company: process.env.KINSTA_COMPANY_ID,
	}).toString();

	const resp = await fetch(`${KinstaAPIUrl}/sites?${query}`, {
		method: 'GET',
		headers,
	});

	const data = await resp.json();
	// console.log(data);
	return data;
}

async function getEnvironmentId(siteId) {
	const resp = await fetch(`${KinstaAPIUrl}/sites/${siteId}/environments`, {
		method: 'GET',
		headers,
	});

	const data = await resp.json();
	return data;
}

app.command('/environment_id', async ({ command, ack, say }) => {
	try {
		await ack();

		let siteName = command.text;

		let response = await getAllSites();
		let mySites = response.company.sites;
		let currentSite = mySites.find((site) => site.name === siteName);

		let envIdResponse = await getEnvironmentId(currentSite.id);
		let envId = envIdResponse.site.environments[0].id;

		say(`Hey 👋,\nYour site ${siteName}'s environment ID is 👉 ${envId}`);
	} catch (error) {
		console.log('err');
		console.error(error);
	}
});

app.command('/site_id', async ({ command, ack, say }) => {
	try {
		await ack();

		let siteName = command.text;

		let response = await getAllSites();
		let mySites = response.company.sites;
		let currentSite = mySites.find((site) => site.name === siteName);

		let siteId = currentSite.id;

		say(`Hey 👋, ${siteName}'s site ID is 👉 ${siteId}`);
	} catch (error) {
		console.log('err');
		console.error(error);
	}
});

(async () => {
	const port = process.env.PORT || 4000;
	// Start your app
	await app.start(process.env.PORT || port);
	console.log(`⚡️ Slack Bolt app is running on port ${port}!`);
})();
