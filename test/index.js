let suites = [];
module.exports = (name, fn) => suites.push({ name, fn });

require('./patch');
require('./reverse');
require('./auto');
require('./diff');
require('./roundtrip');
require('./helpers');
require('./roundtrip');

if ('SUITE' in process.env) {
  suites = suites.filter(s => s.name == process.env.SUITE);
}

void async function main() {
  for (const suite of suites) {
    await suite.fn(async (desc, fn) => {
      if ('TEST' in process.env && desc != process.env.TEST) return;
      try {
        await fn();
        console.log("✓", `[${suite.name}]`, desc);
      } catch(e) {
        console.log("✗", `[${suite.name}]`, desc);
        console.error(e);
      }
    })
  }
}();
