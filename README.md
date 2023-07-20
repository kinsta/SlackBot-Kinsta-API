![image]()

# How To Build a Slackbot With Node.js and Kinsta API For Site Management

This tutorial combines the power of Slack and the Kinsta API to build a Slackbot capable of managing various site tasks. With this Slackbot, we perform actions such as checking site status, clearing a site's cache, restarting a site's PHP engine, and lots more.

Read the [full article](https://kinsta.com/blog/SLUG/).

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
REACT_APP_KINSTA_COMPANY_ID = 'YOUR_COMPANY_ID' 
REACT_APP_KINSTA_API_KEY = 'YOUR_API_KEY'
```

### Port

Kinsta automatically sets the `PORT` environment variable. You should not define it yourself and you should not hard-code it into the application. Use `process.env.PORT` in your code when referring to the server port.

```js
app.listen(process.env.PORT, () => {
    console.log(`Hello World Application is running on port ${process.env.PORT}`)
})
```

### Start Command

When deploying an application Kinsta will automatically create a web process with `npm start` as the entry point. Make sure to use this command to run your server. If you would like to use another command you will need to modify the runtime process in MyKinsta.

```json
  "scripts": {
    "start": "node server.js"
  },
```
### Deployment Lifecycle

Whenever a deployment is initiated (through creating an application or re-deploying due to an incoming commit), the `npm install` and `npm build` commands are run.

## What is Kinsta
Kinsta is a developer-centric cloud host / PaaS. We’re striving to make it easier for you to share your web projects with your users. Focus on coding and building, and we’ll take care of deployment and provide fast, scalable hosting. + 24/7 expert-only support.

- [Start your free trial](https://kinsta.com/signup/?product_type=app-db)
- [Application Hosting](https://kinsta.com/application-hosting)
- [Database Hosting](https://kinsta.com/database-hosting)
