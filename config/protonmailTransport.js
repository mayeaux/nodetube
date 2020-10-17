const pm = require('protonmail-api');

const protonmailTransport = async() => {
  return await pm.connect({
    username: process.env.PROTONMAIL_USERNAME,
    password: process.env.PROTONMAIL_PASSWORD
  });
};

module.exports = {
  protonmailTransport
};