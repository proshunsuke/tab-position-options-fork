import { setupActionHandlers } from "@/src/action/handler";
import { setupStorageHandlers } from "@/src/storage";
import { setupTabHandlers } from "@/src/tabs/handler";
import { setupTestEnvironment } from "@/src/test/setup";

export default defineBackground(() => {
  setupActionHandlers();
  setupStorageHandlers();
  setupTabHandlers();
  setupTestEnvironment();
});
