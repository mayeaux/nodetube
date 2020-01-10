// const webhook = require("webhook-discord")
//
// const Hook = new webhook.Webhook(url);
//
// Hook.info("NodeApp","Info")
//

const fetch = require('node-fetch');

const url = process.env.DISCORD_MODERATION_WEBHOOK_URL;

function sendMessage(message) {
  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({"username": "Moderation Alert", "content": message})
  });
}

module.exports = sendMessage;