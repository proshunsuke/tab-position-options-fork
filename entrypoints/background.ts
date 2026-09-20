import { setupActionHandlers } from "@/src/action/handler";
import { setupCommandHandlers } from "@/src/commands/handler";
import { setupStorageHandlers } from "@/src/settings/state/appData";
import { initializeAllStates } from "@/src/state/initializer";
import { setupTabHandlers } from "@/src/tabs/handler";
import { setupTestEnvironment } from "@/src/test/setup";

export default defineBackground(() => {
  initializeAllStates();
  setupActionHandlers();
  setupCommandHandlers();
  setupStorageHandlers();
  setupTabHandlers();
  setupTestEnvironment();
});
