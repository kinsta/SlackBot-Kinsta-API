const { App } = require('@slack/bolt');
require('dotenv').config();
const schedule = require('node-schedule');

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

async function addManualBackup(environmentId, tag) {
	const resp = await fetch(
		`${KinstaAPIUrl}/sites/environments/${environmentId}/manual-backups`,
		{
			method: 'POST',
			headers: postHeaders,
			body: JSON.stringify({
				tag,
			}),
		}
	);

	const data = await resp.json();
	return data;
}

async function deleteBackup(backupId) {
	const resp = await fetch(
		`${KinstaAPIUrl}/sites/environments/backups/${backupId}`,
		{
			method: 'DELETE',
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

	const siteName = command.text;

	const response = await getAllSites();
	if (response) {
		const mySites = response.company.sites;
		const currentSite = mySites.find((site) => site.name === siteName);

		const envIdResponse = await getEnvironmentId(currentSite.id);
		const envId = envIdResponse.site.environments[0].id;

		if (envId) {
			say(`Hey 👋,\n\nThe environment ID for "${siteName}" is 👉 ${envId}`);
		}
	}
});

app.command('/site_id', async ({ command, ack, say }) => {
	await ack();

	const siteName = command.text;

	const response = await getAllSites();
	const mySites = response.company.sites;
	const currentSite = mySites.find((site) => site.name === siteName);

	const siteId = currentSite.id;
	if (siteId) {
		say(`Hey 👋, \n\nThe site ID for "${siteName}" is 👉 ${siteId}`);
	}
});

app.command('/operation_status', async ({ command, ack, say }) => {
	await ack();

	const operationId = command.text;

	const response = await CheckOperationStatus(operationId);
	const operationMessage = response.message;

	if (operationMessage) {
		say(`Hey 👋, \n\n${operationMessage}`);
	}
});

app.command('/clear_site_cache', async ({ command, ack, say }) => {
	await ack();

	const environmentId = command.text;
	const response = await clearSiteCache(environmentId);

	if (response) {
		say(
			`Hey 👋, \n\n${response.message} by using the /operation_status slack commmand. \n\nOperation Id is ${response.operation_id}`
		);
	}
});

app.command('/restart_php_engine', async ({ command, ack, say }) => {
	await ack();

	const environmentId = command.text;
	const response = await restartPHPEngine(environmentId);

	if (response) {
		say(
			`Hey 👋, \n\n${response.message} by using the /operation_status slack commmand. \n\nOperation Id is ${response.operation_id}`
		);
	}
});

app.command('/get_backups', async ({ command, ack, say }) => {
	await ack();

	const environmentId = command.text;
	const response = await getBackups(environmentId);

	const backups = response.environment.backups;

	const backupDetails = backups
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

	const environmentId = command.text;
	const response = await getDownloadableBackups(environmentId);

	const backups = response.environment.downloadable_backups;

	const downloadable_backupDetails = backups
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

	const response = await restoreBackup(
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

app.command('/add_manual_backup', async ({ command, ack, say }) => {
	await ack();

	const [environmentId, tag] = command.text.split(' ');

	const response = await addManualBackup(environmentId, tag);

	if (response) {
		say(
			`Hey 👋, \n\n${response.message}. You can use the /operation_status slack commmand to check the status of this Operation Id ${response.operation_id}`
		);
	}
});

app.command('/delete_backup', async ({ command, ack, say }) => {
	await ack();

	const backupId = command.text;

	const response = await deleteBackup(backupId);

	if (response) {
		say(`Hey 👋, \n\n${response.message}`);
	}
});

app.command('/get_site_logs', async ({ command, ack, say }) => {
	await ack();

	const [environmentId, fileName, lines] = command.text.split(' ');

	const response = await getSiteLogs(environmentId, fileName, lines);

	if (response) {
		const logs = response.environment.container_info.logs.split('\n');
		const formattedLogs = logs.join('\n\n'); // or any other formatting needed

		say(`Hey 👋, \n\nHere are the logs for ${fileName}:\n\n${formattedLogs}`);
	} else {
		say(`Sorry, no logs found for ${fileName}.`);
	}
});

// Command to schedule backup at a specific time
app.command('/schedule_backup', async ({ command, ack, say }) => {
	await ack();

	// Extract environment ID, tag, and time from the Slack command text
	const [environmentId, tag, time] = command.text.split(' ');

	// Validate time (expecting HH:MM in 24-hour format)
	const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
	if (!time || !timeRegex.test(time)) {
		say('Invalid time format. Please use HH:MM (24-hour format).');
		return;
	}

	const [hour, minute] = time.split(':').map(Number);

	// Schedule the backup
	const date = new Date();
	date.setHours(hour, minute, 0, 0); // Set the time for the scheduled backup

	// Schedule the backup using node-schedule
	schedule.scheduleJob(date, async () => {
		try {
			// Call the function to create a manual backup
			await addManualBackup(environmentId, tag);

			// Notify the user via Slack when the backup is created
			await say(
				`Backup with tag *${tag}* has been successfully created for environment *${environmentId}*.`
			);
		} catch (error) {
			console.error('Error creating scheduled backup:', error);
			await say(
				`Failed to create backup for environment *${environmentId}*. Please try again.`
			);
		}
	});

	// Acknowledge scheduling in Slack immediately
	say(
		`Backup for environment *${environmentId}* has been scheduled at *${time}* with tag *${tag}*.`
	);
});

app.command('/backup_all_sites', async ({ command, ack, say }) => {
	await ack();

	const tag = command.text || 'default-backup-tag'; // Optionally take a tag from the command or use a default

	// Fetch all sites for the company
	const sitesResponse = await getAllSites(); // This function is already defined in your code

	if (sitesResponse && sitesResponse.company && sitesResponse.company.sites) {
		const sites = sitesResponse.company.sites;

		// Iterate through each site and retrieve the environment ID
		for (const site of sites) {
			const envResponse = await getEnvironmentId(site.id); // Fetch the environment ID of the site

			if (envResponse && envResponse.site.environments) {
				const environments = envResponse.site.environments;

				// Create a backup for each environment of the site
				for (const environment of environments) {
					try {
						await addManualBackup(environment.id, tag);

						await say(
							`Backup successfully created for environment *${environment.display_name}* of site *${site.name}* with tag *${tag}*.`
						);
					} catch (error) {
						console.error(
							`Error creating backup for site ${site.name}:`,
							error
						);
						say(
							`Failed to create backup for environment *${environment.display_name}* of site *${site.name}*.`
						);
					}
				}
			} else {
				say(`No environments found for site *${site.name}*.`);
			}
		}
	} else {
		say('No sites found for your company.');
	}
});

app.command('/backup_multiple_envs', async ({ command, ack, say }) => {
	await ack();

	const inputText = command.text;
	const [tag, ...envIds] = inputText.split(' '); // The first part of the command is the tag, and the rest are environment IDs

	if (!envIds.length) {
		say('Please provide at least one environment ID.');
		return;
	}

	// Loop through the environment IDs and create a backup for each
	for (const envId of envIds) {
		try {
			await addManualBackup(envId, tag);

			await say(
				`Backup successfully created for environment ID *${envId}* with tag *${tag}*.`
			);
		} catch (error) {
			console.error(
				`Error creating backup for environment ID ${envId}:`,
				error
			);
			say(`Failed to create backup for environment ID *${envId}*.`);
		}
	}
});

app.command('/schedule_backup_all_sites', async ({ command, ack, say }) => {
	await ack();

	const [tag, time] = command.text.split(' '); // Get the backup tag and the time
	const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/; // Validate time format (24-hour HH:MM)

	if (!time || !timeRegex.test(time)) {
		say('Invalid time format. Please use HH:MM (24-hour format).');
		return;
	}

	const [hour, minute] = time.split(':').map(Number);

	// Schedule the backup
	const date = new Date();
	date.setHours(hour, minute, 0, 0);

	schedule.scheduleJob(date, async () => {
		const sitesResponse = await getAllSites();

		if (sitesResponse && sitesResponse.company && sitesResponse.company.sites) {
			const sites = sitesResponse.company.sites;

			for (const site of sites) {
				const envResponse = await getEnvironmentId(site.id);

				if (envResponse && envResponse.site.environments) {
					const environments = envResponse.site.environments;

					for (const environment of environments) {
						try {
							await addManualBackup(environment.id, tag);

							await say(
								`Scheduled backup successfully created for environment *${environment.display_name}* of site *${site.name}* with tag *${tag}*.`
							);
						} catch (error) {
							console.error(
								`Error creating backup for site ${site.name}:`,
								error
							);
							say(
								`Failed to create scheduled backup for environment *${environment.display_name}* of site *${site.name}*.`
							);
						}
					}
				} else {
					say(`No environments found for site *${site.name}*.`);
				}
			}
		} else {
			say('No sites found for your company.');
		}
	});

	// Respond immediately that scheduling is done
	say(`Backup for all sites scheduled at *${time}* with tag *${tag}*.`);
});

(async () => {
	// Start your app
	await app.start(process.env.PORT || 3000);
	console.log(
		`⚡️ Kinsta Bot app is running on port ${process.env.PORT || 3000}!`
	);
})();
