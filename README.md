
![how-to-build-a-slackbot-with-node js-and-kinsta-api-for-site-management (2)](https://github.com/kinsta/SlackBot-Kinsta-API/assets/57611810/b4ada232-a957-48e4-8511-397fbbafa3fc)

# How To Build a Slackbot With Node.js and Kinsta API For Site Management

This tutorial combines the power of Slack and the Kinsta API to build a Slackbot capable of managing various site tasks. With this Slackbot, we perform actions such as checking site status, clearing a site's cache, restarting a site's PHP engine, and lots more.

Read the [full article](https://kinsta.com/blog/create-slackbot-site-management).

## Installation
1. Clone or fork the repository.

## Kinsta Application Hosting Setup
### Dependency Management

During the deployment process, Kinsta will automatically install dependencies defined in your `package.json` file.

### Environment Variables
When deploying, add the following environment variables:

```bash
SLACK_SIGNING_SECRET="YOUR_SIGNING_SECRET"
SLACK_BOT_TOKEN="xoxb-YOUR_BOT_TOKEN"
APP_TOKEN="xapp-YOUR_APP_TOKEN"
KINSTA_COMPANY_ID = "YOUR_COMPANY_ID" 
KINSTA_API_KEY = "YOUR_API_KEY"
```

### Port

Kinsta automatically sets the `PORT` environment variable. You should not define it yourself and you should not hard-code it into the application. Use `process.env.PORT` in your code when referring to the server port.

```js
(async () => {
	// Start your app
	await app.start(process.env.PORT);
	console.log(`⚡️ Kinsta Bot app is running on port ${process.env.PORT}!`);
})();
```

### Start Command

When deploying an application Kinsta will automatically create a web process with `npm start` as the entry point. Make sure to use this command to run your server. If you would like to use another command you will need to modify the runtime process in MyKinsta.

```json
  "scripts": {
    "start": "node app.js"
  },
```
### Deployment Lifecycle

Whenever a deployment is initiated (through creating an application or re-deploying due to an incoming commit), the `npm install` and `npm build` commands are run.

## Slackbot Slash Commands
1. `/environment_id [site_name]`: Get the environment ID for a given site name.

**Parameters:**
- `site_name` (required): The name of the site.

**Example:**
```bash
/environment_id my-website
```

2. `/site_id [site_name]`: Get the site ID for a given site name.

**Parameters:**
- `site_name` (required): The name of the site.

**Example:**
```bash
/site_id my-website
```

3. `/operation_status [operation_id]`: Check the status of a Kinsta operation using the operation ID.

**Parameters:**
- `operation_id` (required): The ID of the operation.

**Example:**
```bash
/operation_status 123456
```

4. `/clear_site_cache [environment_id]`: Clear the cache for a given environment.

**Parameters:**
- `environment_id` (required): The environment ID.

**Example:**
```bash
/clear_site_cache 987654
```

5. `/restart_php_engine [environment_id]`: Restart the PHP engine for a given environment.

**Parameters:**
environment_id (required): The environment ID.

**Example:**
```bash
/restart_php_engine 987654
```

6. `/get_backups [environment_id]`: Fetch all backups (manual, scheduled, and system-generated) for a given environment.

**Parameters:**
- `environment_id` (required): The environment ID.
- 
**Example:**
```bash
/get_backups 987654
```

7. `/get_downloadable_backups [environment_id]`: Fetch all downloadable backups for a given environment.

**Parameters:**
- `environment_id` (required): The environment ID.

**Example:**
```bash
/get_downloadable_backups 987654
```

8. `/restore_backup [target_environment_id] [backup_id] [environment_name]`: Restore a backup for a target environment using a given backup ID and environment name.

**Parameters:**
- `target_environment_id` (required): The ID of the target environment.
backup_id (required): The ID of the backup.
- `environment_name` (required): The name of the environment from which the backup originated.

**Example:**
```bash
/restore_backup 123 456 staging
```

9. `/add_manual_backup [environment_id] [tag]`: Create a manual backup with a specific tag for a given environment.

**Parameters:**
- `environment_id` (required): The environment ID.
- `tag` (required): A tag for the backup.

**Example:**
```bash
/add_manual_backup 987654 "Backup before update"
```

10. `/delete_backup [backup_id]`: Delete a backup by its ID.

**Parameters:**
- `backup_id` (required): The ID of the backup to delete.

**Example:**
```bash
/delete_backup 456789
```

11. /get_site_logs [environment_id] [file_name] [lines]: Get site logs from a specific environment.

**Parameters:**
- `environment_id` (required): The environment ID.
- `file_name` (optional): The log file name (default: error).
- `lines` (optional): Number of lines to fetch (default: 1000).

**Example:**
```bash
/get_site_logs 987654 error 500
```

12. /schedule_backup [environment_id] [tag] [time]: Schedule a backup at a specific time.

**Parameters:**
- `environment_id` (required): The environment ID.
- `tag` (required): The tag for the backup.
- `time` (required): The time to schedule the backup (in HH 24-hour format).

**Example:**
```bash
/schedule_backup 987654 "Scheduled Backup" 14:30
```

13.  `/backup_all_sites [tag]`: Create a manual backup for all environments across all sites.

**Parameters:**
- `tag` (optional): A tag for the backups (default: default-backup-tag).

**Example:**
```bash
/backup_all_sites "Maintenance Backup"
```

14.  `/backup_multiple_envs [tag] [env_id1] [env_id2] ...`: Create backups for multiple environments with a specific tag.

**Parameters:**
- `tag` (required): The tag for the backup.
- `env_ids` (required): Space-separated environment IDs.

**Example:**
```bash
/backup_multiple_envs "Multiple Envs Backup" 987654 876543
```

15.  `/schedule_backup_all_sites [tag] [time]`: Schedule backups for all sites at a specific time.

**Parameters:**
- `tag` (required): The tag for the backups.
- `time` (required): The time to schedule the backup (in HH 24-hour format).

**Example:**
```bash
/schedule_backup_all_sites "Scheduled Backup" 15:00
```

## What is Kinsta
Kinsta is a developer-centric cloud host / PaaS. We’re striving to make it easier for you to share your web projects with your users. Focus on coding and building, and we’ll take care of deployment and provide fast, scalable hosting. + 24/7 expert-only support.

- [WordPress Hosting](https://kinsta.com)
- [Application Hosting](https://kinsta.com/application-hosting)
- [Database Hosting](https://kinsta.com/database-hosting)
