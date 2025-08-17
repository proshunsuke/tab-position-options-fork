/**
 * シンプルな状態管理システム
 * Service Workerの特性に対応し、初期化不要で動作
 */

// グローバルメモリキャッシュ
// Service Worker再起動時にクリアされるが、それを前提とした設計
const memoryCache = new Map<string, unknown>();

/**
 * 状態管理オブジェクトを作成するファクトリー関数
 * @param key ストレージのキー
 * @param defaultValue デフォルト値
 * @param useSession sessionStorageを使用するか（デフォルト: true）
 */
export const createState = <T>(key: string, defaultValue: T, useSession = true) => {
  return {
    /**
     * 値を取得
     * メモリ → ストレージ → デフォルト値の順で取得
     */
    get: async () => {
      if (memoryCache.has(key)) {
        const cached = memoryCache.get(key) as T;
        return cached;
      }

      try {
        const storage = useSession ? chrome.storage.session : chrome.storage.local;
        const result = await storage.get(key);

        if (result[key] !== undefined) {
          const value = result[key] as T;
          memoryCache.set(key, value);
          return value;
        }
      } catch (_error) {}

      return defaultValue;
    },

    /**
     * 値を設定
     * メモリとストレージ両方に保存
     */
    set: async (value: T) => {
      memoryCache.set(key, value);

      try {
        const storage = useSession ? chrome.storage.session : chrome.storage.local;
        await storage.set({ [key]: value });
      } catch (_error) {}
    },

    /**
     * 値をクリア
     */
    clear: async () => {
      memoryCache.delete(key);

      try {
        const storage = useSession ? chrome.storage.session : chrome.storage.local;
        await storage.remove(key);
      } catch (_error) {}
    },
  };
};

/**
 * Map型の状態を管理するヘルパー
 * MapをArrayにシリアライズして保存
 */
export const createMapState = <K, V>(key: string, useSession = true) => {
  const state = createState<[K, V][]>(key, [], useSession);

  return {
    get: async () => {
      const entries = await state.get();
      return new Map(entries);
    },

    set: async (map: Map<K, V>) => {
      await state.set(Array.from(map.entries()));
    },

    clear: async () => {
      await state.clear();
    },
  };
};

// テスト用のヘルパー関数をエクスポート（本番環境では使用されない）
// biome-ignore lint/style/useNamingConvention: Test-only export with intentional double underscore
export const __testHelpers = {
  /**
   * メモリキャッシュをクリア（テスト用）
   */
  clearMemoryCache: () => {
    memoryCache.clear();
  },

  /**
   * メモリキャッシュのサイズを取得（テスト用）
   */
  getMemoryCacheSize: () => {
    return memoryCache.size;
  },

  /**
   * 特定のキーがメモリキャッシュに存在するか確認（テスト用）
   */
  hasInMemoryCache: (key: string) => {
    return memoryCache.has(key);
  },

  /**
   * メモリキャッシュの全キーを取得（テスト用）
   */
  getMemoryCacheKeys: () => {
    return Array.from(memoryCache.keys());
  },
};
