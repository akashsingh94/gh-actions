const core = require("@actions/core")(() => {
  async function run() {
    core.info("I am custom js action");
  }

  run();
})();
