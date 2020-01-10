const fs = require('fs-extra');

console.log('Copying settings and private file if necessary');

fs.copySync('.env.settings.sample', '.env.settings', { overwrite: false });

fs.copySync('.env.private.sample', '.env.private', { overwrite: false });
