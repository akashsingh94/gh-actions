const core = require("@actions/core");
const exec = require("@actions/exec");
const github = require("@actions/github");

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

    if (gitStatus.stdout.length > 0) {
      core.info(`[js-dependency-update]: There are updates available`);
      await exec.exec('git config --global user.name "gh-automation"');
      await exec.exec(
        'git config --global user.email "gh-automation@email.com"'
      );
      await exec.exec(`git checkout -b ${targetBranch}`, [], {
        cwd: workingDir,
      });
      await exec.exec("git add package.json package-lock.json", [], {
        cwd: workingDir,
      });
      await exec.exec(
        'git commit -m "automation: updating the dependency package"'
      );
      await exec.exec(`git push -u origin ${targetBranch} --force`);
      try {
        const octokit = github.getOctokit(ghToken);
        await octokit.rest.pulls.create({
          owner: github.context.repo.owner,
          repo: github.context.repo.repo,
          title: "Update NPM dependency",
          body: "This PR request updates the NPM libraries",
          base: baseBranch,
          head: targetBranch,
        });
      } catch (error) {
        core.error("Unable to create the PR");
        core.setFailed(error.message);
        core.error(error);
      }
    } else {
      core.info(`[js-dependency-update]: There are no updates available`);
    }
  }

  run();
})();
