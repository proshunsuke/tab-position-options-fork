import { setupActionHandlers } from "@/src/action/handler";
import { setupStorageHandlers } from "@/src/settings/state/appData";
import { setupTabHandlers } from "@/src/tabs/handler";
import { setupTestEnvironment } from "@/src/test/setup";

export default defineBackground(() => {
  setupActionHandlers();
  setupStorageHandlers();
  setupTabHandlers();
  setupTestEnvironment();
});
