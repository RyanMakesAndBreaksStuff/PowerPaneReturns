var execSync = require('child_process').execSync,
    argv = require('yargs/yargs')(process.argv.slice(2)).argv,
    targets = require('./targets');

var buildVersion = argv.buildVersion;
if(typeof buildVersion === 'undefined' || buildVersion === null || buildVersion === "") {
    buildVersion = require('../package.json').version;
}

targets.forEach(function (target) {
    execSync('npm run build -- --target=' + target + ' --buildVersion=' + buildVersion, {stdio: [0, 1, 2]});
});
