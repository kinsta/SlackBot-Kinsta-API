const { App } = require('@slack/bolt');
require('dotenv').config();

// Initialization
const app = new App({
	token: process.env.SLACK_BOT_TOKEN,
	signingSecret: process.env.SLACK_SIGNING_SECRET,
	socketMode: true, // enable the following to use socket mode
	appToken: process.env.APP_TOKEN,
});

// kinsta API utilities
const KinstaAPIUrl = 'https://api.kinsta.com/v2';

const getHeaders = {
	Authorization: `Bearer ${process.env.KINSTA_API_KEY}`,
};

const postHeaders = {
	'Content-Type': 'application/json',
	Authorization: `Bearer ${process.env.KINSTA_API_KEY}`,
};

// querying Kinsta API
async function getAllSites() {
	const query = new URLSearchParams({
		company: process.env.KINSTA_COMPANY_ID,
	}).toString();

	const resp = await fetch(`${KinstaAPIUrl}/sites?${query}`, {
		method: 'GET',
		headers: getHeaders,
	});

	const data = await resp.json();
	// console.log(data);
	return data;
}

async function getEnvironmentId(siteId) {
	const resp = await fetch(`${KinstaAPIUrl}/sites/${siteId}/environments`, {
		method: 'GET',
		headers: getHeaders,
	});

	const data = await resp.json();
	return data;
}

async function CheckOperationStatus(operationId) {
	const resp = await fetch(`${KinstaAPIUrl}/operations/${operationId}`, {
		method: 'GET',
		headers: getHeaders,
	});

	const data = await resp.json();
	return data;
}

async function clearSiteCache(environmentId) {
	const resp = await fetch(`${KinstaAPIUrl}/sites/tools/clear-cache`, {
		method: 'POST',
		headers: postHeaders,
		body: JSON.stringify({
			environment_id: environmentId,
		}),
	});

	const data = await resp.json();
	return data;
}

async function restartPHPEngine(environmentId) {
	const resp = await fetch(`${KinstaAPIUrl}/sites/tools/restart-php`, {
		method: 'POST',
		headers: postHeaders,
		body: JSON.stringify({
			environment_id: environmentId,
		}),
	});

	const data = await resp.json();
	return data;
}

// --- Handling backups with Kinsta API --- //

// Get manual, schedule and system generated backups

async function getBackups(environmentId) {
	const resp = await fetch(
		`${KinstaAPIUrl}/sites/environments/${environmentId}/backups`,
		{
			method: 'GET',
			headers: getHeaders,
		}
	);

	const data = await resp.json();
	return data;
}

// -------- SLASH COMMANDS ---------- //

// creating slash commands
app.command('/environment_id', async ({ command, ack, say }) => {
	await ack();

	let siteName = command.text;

	let response = await getAllSites();
	if (response) {
		let mySites = response.company.sites;
		let currentSite = mySites.find((site) => site.name === siteName);

		let envIdResponse = await getEnvironmentId(currentSite.id);
		let envId = envIdResponse.site.environments[0].id;

		if (envId) {
			say(`Hey 👋,\n\nThe environment ID for "${siteName}" is 👉 ${envId}`);
		}
	}
});

app.command('/site_id', async ({ command, ack, say }) => {
	await ack();

	let siteName = command.text;

	let response = await getAllSites();
	let mySites = response.company.sites;
	let currentSite = mySites.find((site) => site.name === siteName);

	let siteId = currentSite.id;
	if (siteId) {
		say(`Hey 👋, \n\nThe site ID for "${siteName}" is 👉 ${siteId}`);
	}
});

app.command('/operation_status', async ({ command, ack, say }) => {
	await ack();

	let operationId = command.text;

	let response = await CheckOperationStatus(operationId);
	let operationMessage = response.message;

	if (operationMessage) {
		say(`Hey 👋, \n\n${operationMessage}`);
	}
});

app.command('/clear_site_cache', async ({ command, ack, say }) => {
	await ack();

	let environmentId = command.text;
	let response = await clearSiteCache(environmentId);

	if (response) {
		say(
			`Hey 👋, \n\n${response.message} by using the /operation_status slack commmand. \n\nOperation Id is ${response.operation_id}`
		);
	}
});

app.command('/restart_php_engine', async ({ command, ack, say }) => {
	await ack();

	let environmentId = command.text;
	let response = await restartPHPEngine(environmentId);

	if (response) {
		say(
			`Hey 👋, \n\n${response.message} by using the /operation_status slack commmand. \n\nOperation Id is ${response.operation_id}`
		);
	}
});

app.command('/get_backups', async ({ command, ack, say }) => {
	await ack();

	let environmentId = command.text;
	let response = await getBackups(environmentId);

	let backups = response.environment.backups;

	let backupDetails = backups
		.map((backup) => {
			return `Backup ID: ${backup.id}\nName: ${backup.name}\nNote: ${
				backup.note
			}\nType: ${backup.type}\nCreated At: ${new Date(backup.created_at)}\n\n`;
		})
		.join('');

	if (backupDetails) {
		say(
			`Hey 👋, here are the backup details for environment ID ${environmentId}:\n\n${backupDetails}`
		);
	} else {
		say(`No backups found for environment ID ${environmentId}`);
	}
});

(async () => {
	// Start your app
	await app.start(process.env.PORT || 3000);
	console.log(
		`⚡️ Kinsta Bot app is running on port ${process.env.PORT || 3000}!`
	);
})();
