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

async function getSiteLogs(environmentId, fileName, lines) {
	const query = new URLSearchParams({
		file_name: fileName || 'error',
		lines: lines || 1000,
	}).toString();

	const envId = 'YOUR_env_id_PARAMETER';
	const resp = await fetch(
		`https://api.kinsta.com/v2/sites/environments/${environmentId}/logs?${query}`,
		{
			method: 'GET',
			headers: getHeaders,
		}
	);

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

async function getDownloadableBackups(environmentId) {
	const resp = await fetch(
		`${KinstaAPIUrl}/sites/environments/${environmentId}/downloadable-backups`,
		{
			method: 'GET',
			headers: getHeaders,
		}
	);

	const data = await resp.json();
	return data;
}

async function restoreBackup(targetEnvironmentId, backupId, environmentName) {
	const resp = await fetch(
		`${KinstaAPIUrl}/sites/environments/${targetEnvironmentId}/backups/restore`,
		{
			method: 'POST',
			headers: postHeaders,
			body: JSON.stringify({
				backup_id: backupId,
				env_display_name_of_backup: environmentName,
			}),
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

app.command('/get_downloadable_backups', async ({ command, ack, say }) => {
	await ack();

	let environmentId = command.text;
	let response = await getDownloadableBackups(environmentId);

	let backups = response.environment.downloadable_backups;

	let downloadable_backupDetails = backups
		.map((backup) => {
			return `Backup ID: ${backup.id}\nDownload Link: ${
				backup.download_link
			}\nCreated At: ${new Date(backup.created_at)}\nExpires At: ${new Date(
				backup.expires_at
			)}\nIs Generation in Progress: ${backup.is_generation_in_progress}\n\n`;
		})
		.join('');

	if (downloadable_backupDetails) {
		say(
			`Hey 👋, here are the downloadable backup details for environment ${environmentId}:\n\n${downloadable_backupDetails}`
		);
	} else {
		say(`No downloadable backups found for environment ${environmentId}`);
	}
});

app.command('/restore_backup', async ({ command, ack, say }) => {
	await ack();

	const [targetEnvironmentId, backupId, environmentName] =
		command.text.split(' ');

	let response = await restoreBackup(
		targetEnvironmentId,
		backupId,
		environmentName
	);

	if (response) {
		say(
			`Hey 👋, \n\n${response.message}. You can use the /operation_status slack commmand to check the status of this Operation Id ${response.operation_id}`
		);
	}
});

app.command('/get_site_logs', async ({ command, ack, say }) => {
	await ack();

	const [environmentId, fileName, lines] = command.text.split(' ');

	let response = await getSiteLogs(environmentId, fileName, lines);

	if (response) {
		const logs = response.environment.container_info.logs.split('\n');
		const formattedLogs = logs.join('\n\n'); // or any other formatting needed

		say(`Hey 👋, \n\nHere are the logs for ${fileName}:\n\n${formattedLogs}`);
	} else {
		say(`Sorry, no logs found for ${fileName}.`);
	}
});

(async () => {
	// Start your app
	await app.start(process.env.PORT || 3000);
	console.log(
		`⚡️ Kinsta Bot app is running on port ${process.env.PORT || 3000}!`
	);
})();
