const fs = require('fs');

// destination.txt will be created or overwritten by default.
fs.copyFile('.env.settings.sample', '.env.settings', { flag: 'wx' }, (err) => {
  if(err)throw err;
  console.log('Settings file created');
});

// destination.txt will be created or overwritten by default.
fs.copyFile('.env.private.sample', '.env.private', { flag: 'wx' }, (err) => {
  if(err)throw err;
  console.log('Private keys file created');
});