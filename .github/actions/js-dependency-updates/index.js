const core = require("@actions/core");
const exec = require("@actions/exec");

(() => {
  async function run() {
    const baseBranch = core.getInput("base-branch");
    const targetBranch = core.getInput("target-branch");
    const ghToken = core.getInput("gh-token");
    const workingDir = core.getInput("working-directory");
    const debug = core.getBooleanInput("debug");

    core.setSecret(ghToken);

    core.info(`[js-dependency-update]: base branch is: ${baseBranch}`);
    core.info(`[js-dependency-update]: target branch is: ${targetBranch}`);
    core.info(`[js-dependency-update]: working directory is: ${workingDir}`);

    //execute npm update command
    await exec.exec("npm update", [], {
      cwd: workingDir,
    });

    //check if the package.json file got changes
    const gitStatus = await exec.getExecOutput(
      "git status -s package*.json",
      [],
      {
        cwd: workingDir,
      }
    );

    if (gitStatus.stdout.length > 0)
      core.info(`[js-dependency-update]: There are updates available`);
    else core.info(`[js-dependency-update]: There are no updates available`);
  }

  run();
})();
