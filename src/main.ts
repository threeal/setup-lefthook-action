import { addPath, getInput, setOutput } from "ghakit/io";
import {
  beginLogGroup,
  endLogGroup,
  logCommand,
  logError,
  logInfo,
} from "ghakit/log";
import { getRunnerToolCache } from "ghakit/vars";
import { setupLefthookAction } from "./action.js";
import { fetchLatestLefthookVersion } from "./lefthook.js";

await setupLefthookAction({
  addPath,
  beginLogGroup,
  endLogGroup,
  fetchLatestLefthookVersion,
  getRunnerToolCache,
  getInput,
  logCommand,
  logInfo,
  setOutput,
}).catch((err: unknown) => {
  logError(err);
  process.exitCode = 1;
});
