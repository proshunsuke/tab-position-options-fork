/**
 * Service Worker終了後も状態を維持するための汎用的な状態管理クラス
 *
 * 3層構造のフォールバック機構:
 * 1. メモリキャッシュ（最速）
 * 2. ストレージソース（session/local/カスタム）
 * 3. デフォルト値（必ずフォールバック）
 */

type StorageSource = "session" | "local" | "custom";

type StateManagerOptions<T> = {
  serialize?: (value: T) => unknown;
  deserialize?: (value: unknown) => T;
  storageSource?: StorageSource;
  // カスタムストレージソース用
  getFromSource?: () => Promise<T | undefined>;
  saveToSource?: (value: T) => Promise<void>;
};

export class StateManager<T> {
  private memoryCache: T | undefined;
  private readonly key: string;
  private readonly defaultValue: T;
  private readonly serialize: (value: T) => unknown;
  private readonly deserialize: (value: unknown) => T;

  private readonly storageSource: StorageSource;
  private readonly getFromSource?: () => Promise<T | undefined>;
  private readonly saveToSource?: (value: T) => Promise<void>;

  constructor(key: string, defaultValue: T, options?: StateManagerOptions<T>) {
    this.key = key;
    this.defaultValue = defaultValue;
    this.serialize = options?.serialize || (v => v);
    this.deserialize = options?.deserialize || (v => v as T);
    this.storageSource = options?.storageSource || "session";
    this.getFromSource = options?.getFromSource;
    this.saveToSource = options?.saveToSource;
  }

  /**
   * 値を取得する
   * メモリ → session → デフォルト値の順でフォールバック
   */
  async get(): Promise<T> {
    // 1. メモリキャッシュから取得（最速）
    if (this.memoryCache !== undefined) {
      return this.memoryCache;
    }

    // 2. ストレージソースから取得
    try {
      let value: T | undefined;

      if (this.storageSource === "custom" && this.getFromSource) {
        // カスタムソースから取得
        value = await this.getFromSource();
      } else if (typeof chrome !== "undefined" && chrome.storage) {
        // Chrome storageから取得
        const storage =
          this.storageSource === "local" ? chrome.storage.local : chrome.storage.session;
        if (storage) {
          const result = await storage.get(this.key);
          if (result[this.key] !== undefined) {
            value = this.deserialize(result[this.key]);
          }
        }
      }

      if (value !== undefined) {
        this.memoryCache = value;
        return this.memoryCache;
      }
    } catch (error) {
      // ストレージが使えない場合は継続
      console.warn(`Failed to read from ${this.storageSource} storage: ${this.key}`, error);
    }

    // 3. デフォルト値を返す（必ずフォールバック）
    return this.defaultValue;
  }

  /**
   * 値を設定する
   * メモリとsessionの両方に保存
   */
  async set(value: T): Promise<void> {
    // メモリに即座に反映
    this.memoryCache = value;

    // バックグラウンドでストレージに保存（非同期だがエラーは無視）
    try {
      if (this.storageSource === "custom" && this.saveToSource) {
        // カスタムソースに保存
        await this.saveToSource(value);
      } else if (typeof chrome !== "undefined" && chrome.storage) {
        // Chrome storageに保存
        const storage =
          this.storageSource === "local" ? chrome.storage.local : chrome.storage.session;
        if (storage) {
          await storage.set({ [this.key]: this.serialize(value) });
        }
      }
    } catch (error) {
      console.warn(`Failed to save to ${this.storageSource} storage: ${this.key}`, error);
    }
  }

  /**
   * 値をクリアする
   */
  async clear(): Promise<void> {
    this.memoryCache = undefined;

    try {
      if (this.storageSource === "custom") {
        // カスタムソースはクリア対応なし（saveToSourceでundefinedを保存）
        if (this.saveToSource) {
          await this.saveToSource(this.defaultValue);
        }
      } else if (typeof chrome !== "undefined" && chrome.storage) {
        const storage =
          this.storageSource === "local" ? chrome.storage.local : chrome.storage.session;
        if (storage) {
          await storage.remove(this.key);
        }
      }
    } catch (error) {
      console.warn(`Failed to clear ${this.storageSource} storage: ${this.key}`, error);
    }
  }

  /**
   * Service Worker起動時にストレージから復元
   */
  async initialize(): Promise<void> {
    try {
      // getメソッドを再利用（メモリキャッシュをクリアしてから）
      this.memoryCache = undefined;
      await this.get();
    } catch (error) {
      // エラーは無視してデフォルト値を使用
      console.warn(`Failed to initialize from ${this.storageSource} storage: ${this.key}`, error);
    }
  }

  /**
   * 現在のメモリキャッシュの値を取得（デバッグ用）
   */
  getCached(): T | undefined {
    return this.memoryCache;
  }
}
