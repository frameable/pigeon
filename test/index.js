const suites = [];
module.exports = (name, fn) => suites.push({ name, fn });

require('./patch');
require('./reverse');
require('./auto');
require('./diff');

void async function main() {
  for (const suite of suites) {
    await suite.fn(async (desc, fn) => {
      await fn();
      console.log("✓", `[${suite.name}]`, desc);
    })
  }
}();
