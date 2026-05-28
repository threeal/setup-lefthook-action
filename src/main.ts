import { logError } from "ghakit/log";
import { setupLefthookAction } from "./action.js";

await setupLefthookAction().catch((err: unknown) => {
  logError(err);
  process.exitCode = 1;
});
