// const webhook = require("webhook-discord")
//
// const Hook = new webhook.Webhook(url);
//
// Hook.info("NodeApp","Info")
//

const url = process.env.DISCORD_MODERATION_WEBHOOK_URL
const fetch = require('node-fetch');

function sendMessage(message) {
  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({"username": "Hashnode Bot", "content": `New blog post :laughing: [${message.title}](${message.url})`})
  });
}

sendMessage({
  title: 'hello',
  url: 'hello'
});