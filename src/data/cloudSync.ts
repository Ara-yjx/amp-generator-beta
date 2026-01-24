import { getExperiment, updateExperimentData } from "./backend";
import { transformOldValues, transformValuesOnSave } from "./backwardCompatibility";

/**
 * This is the single point for loading/saving experiment data to the cloud.
 * It does 
 * - request dedupe
 * - debouncing
 * - ask for confirmation when remote version conflict
 */
export class CloudSyncUtil {
  experimentId: number;
  debouncer: Debouncer<any, void>;
  
  // Track if we're in initial load to skip auto-save
  isInitialLoading: boolean = false;
  
  // Last saved timestamp from server for conflict detection
  lastSavedTimestamp: string | null = null;
  
  // Expected remote settings string for deduplication
  expectedRemoteSettings: string | null = null;

  // Callbacks for UI state updates
  onStateChange?: (inFlight: boolean, pending: boolean) => void;
  onSaveComplete?: (success: boolean) => void;
  onVersionConflict?: (cloudTimestamp: string, localTimestamp: string) => Promise<boolean>;

  constructor(
    experimentId: number,
    options?: {
      onStateChange?: (inFlight: boolean, pending: boolean) => void;
      onSaveComplete?: (success: boolean) => void;
      onVersionConflict?: (cloudTimestamp: string, localTimestamp: string) => Promise<boolean>;
    }
  ) {
    this.experimentId = experimentId;
    this.onStateChange = options?.onStateChange;
    this.onSaveComplete = options?.onSaveComplete;
    this.onVersionConflict = options?.onVersionConflict;

    const onCallbackResponse = (success: boolean, response: any) => {
      this.onSaveComplete?.(success);
    };

    this.debouncer = new Debouncer<any, void>({
      callback: this.saveToCloud.bind(this),
      delay: 2000, // 2s after last change
      interval: 5000, // at least 5s between two saves
      onStateChange: this.onStateChange,
      onCallbackResponse,
    });
  }

  /**
   * Load experiment data from cloud, transform old formats, and return parsed settings.
   * Sets isInitialLoading flag to prevent auto-save during load.
   */
  async initLoad(): Promise<any> {
    this.isInitialLoading = true;
    
    try {
      const { experiment } = await getExperiment(this.experimentId);
      const settings = experiment.experimentData?.settings;
      
      if (settings) {
        this.expectedRemoteSettings = settings;
        this.lastSavedTimestamp = experiment.lastUpdatedAt;
        
        try {
          const parsed = JSON.parse(settings);
          
          if (!parsed.values) {
            console.warn('Cloud data has no values, returning null');
            return null;
          }
          
          // Transform old formats to current
          transformOldValues(parsed.values);
          return parsed;
        } catch (e) {
          console.error('Failed to parse settings:', e);
          throw e;
        }
      }
      
      return null;
    } finally {
      // Allow saves after load completes
      this.isInitialLoading = false;
    }
  }

  /**
   * Push new values to the save queue (will be debounced).
   * Checks skip conditions before queuing.
   * @param payload JSON string in format {values: ...}
   */
  save(payload: string) {
    // Skip save during initial load
    if (this.isInitialLoading) {
      return;
    }

    // Parse to check editorBrokenMode
    try {
      const parsed = JSON.parse(payload);
      if (parsed.values?.editorBrokenMode) {
        return;
      }
    } catch (e) {
      console.error('Failed to parse payload in save():', e);
      return;
    }

    this.debouncer.push(payload);
  }

  /**
   * Core save logic: fetch remote, compare, handle conflicts, save to backend.
   * @param payload JSON string in format {values: ...}
   */
  private async saveToCloud(payload: string): Promise<void> {
    // Parse the payload
    const parsed = JSON.parse(payload);
    const values = parsed.values;
    
    // Fetch current remote version
    const { experiment } = await getExperiment(this.experimentId);
    
    // Transform and stringify local values
    const localSettings = JSON.stringify(transformValuesOnSave({ values }));
    
    // Skip if no changes compared to remote
    const remoteSettings = experiment.experimentData?.settings;
    if (remoteSettings === localSettings) {
      return;
    }
    
    // Check for timestamp conflict
    const cloudTimestamp = experiment.lastUpdatedAt;
    const localTimestamp = this.lastSavedTimestamp;
    
    if (cloudTimestamp && localTimestamp && cloudTimestamp !== localTimestamp) {
      // Ask user via callback - if callback returns true, proceed with save
      if (this.onVersionConflict) {
        const shouldOverwrite = await this.onVersionConflict(cloudTimestamp, localTimestamp);
        if (!shouldOverwrite) {
          return;
        }
      } else {
        // No conflict handler provided, skip save for safety
        console.error('Version conflict detected but no handler provided');
        return;
      }
    }
    
    // Perform the save
    const { experiment: updatedExperiment } = await updateExperimentData(this.experimentId, {
      experimentData: {
        settings: localSettings,
      }
    });
    
    // Update tracking variables
    this.lastSavedTimestamp = updatedExperiment.lastUpdatedAt;
    this.expectedRemoteSettings = localSettings;
  }

  /**
   * Clean up resources
   */
  dispose() {
    this.debouncer.dispose();
  }
}

// Singleton instance management
let instance: CloudSyncUtil | null = null;

/**
 * Get or create a CloudSyncUtil singleton for the given experiment.
 * If experimentId changes, disposes old instance and creates a new one.
 */
export function getCloudSyncUtil(
  experimentId: number,
  options?: {
    onStateChange?: (inFlight: boolean, pending: boolean) => void;
    onSaveComplete?: (success: boolean) => void;
    onVersionConflict?: (cloudTimestamp: string, localTimestamp: string) => Promise<boolean>;
  }
): CloudSyncUtil {
  if (!instance || instance.experimentId !== experimentId) {
    instance?.dispose();
    instance = new CloudSyncUtil(experimentId, options);
  }
  return instance;
}

/**
 * Dispose the current singleton instance
 */
export function disposeCloudSyncUtil() {
  instance?.dispose();
  instance = null;
}

/**
 * A generic debouncer class that ensures only one request in-flight
 * Callback is called `delay` ms after the last call, and `interval` ms after the previous callback resolved.
 */
class Debouncer<T, V> {

  // State machine:
  //   in-flight           ---res/rej--> [idle]
  //   pending + in-flight ---res/rej--> pending + scheduled   // shedule
  //   pending + scheduled ---timeup---> in-flight             // launch
  //   [idle]              ---push------> pending + scheduled  // shedule
  //   in-flight           ---push------> pending + in-flight
  //   pending + scheduled ---push------> pending + scheduled  // reschedule + replace
  //   pending + in-flight ---push------> pending + in-flight  // replace
  //
  // Valid states:           Valid transitions:
  //   [idle]                  push
  //   pending + scheduled     push, timeup
  //   pending + in-flight     push, res/rej
  //   in-flight               push, res/rej

  callback: (payload: T) => Promise<V>;
  // hashFn: (request: T) => string | number;
  delay: number; // delay after push
  interval: number; // interval between two callbacks, usually should be larger than delay
  onStateChange?: (inFlight: boolean, pending: boolean) => void;
  onCallbackResponse?: (success: boolean, response: V | null) => void;

  // state variables
  inFlightPayload: T | null = null;
  pendingPayload: T | null = null;
  pendingTimer: ReturnType<typeof setTimeout> | null = null;
  // beforeunload handler reference so we can remove it when disposing
  _beforeUnloadHandler: (() => void) | null = null;

  // determine timeout
  lastPushTimestamp: number = 0;
  lastFlightTimestamp: number = 0; // flight done timestamp

  // record response
  lastFlightResponse: { success: boolean; response: V | null } | null = null;
  // track last successful payload for deduplication
  lastSuccessPayload: T | null = null;

  constructor({
    callback, delay, interval, onStateChange, onCallbackResponse
  }: {
    callback: (payload: T) => Promise<V>;
    // hashFn: (request: T) => string | number,
    delay: number,
    interval: number,
    onStateChange?: (inFlight: boolean, pending: boolean) => void,
    onCallbackResponse?: (success: boolean, response: V | null) => void,
  }) {
    this.callback = callback;
    // this.hashFn = hashFn;
    this.delay = delay;
    this.interval = interval;
    this.onStateChange = onStateChange;
    this.onCallbackResponse = onCallbackResponse;
    // on window close, launch immediately; keep a reference so we can remove it when disposing
    this._beforeUnloadHandler = () => {
      if (this.pendingPayload != null) {
        this.launch();
      }
    };
    window.addEventListener('beforeunload', this._beforeUnloadHandler);
  }

  push(payload: T) {
    // Value deduplication to prevent infinite loops:
    // 1. If same as in-flight and no pending, skip (already processing this)
    if (this.inFlightPayload != null && this.pendingPayload == null) {
      if (payload === this.inFlightPayload) {
        return;
      }
    }
    
    // 2. If same as last success and idle, skip (already saved this)
    if (this.inFlightPayload == null && this.pendingPayload == null && this.lastSuccessPayload != null) {
      if (payload === this.lastSuccessPayload) {
        return;
      }
    }

    this.pendingPayload = payload;
    this.lastPushTimestamp = performance.now();

    if (this.inFlightPayload == null) {
      if (this.pendingTimer != null) {
        clearTimeout(this.pendingTimer);
        this.pendingTimer = null;
      }
      this.scheduleLaunch();
    }

    this.emitStateChange();
  }

  onCallbackDone({ success, response }: { success: boolean; response: V | null }) {
    //   in-flight           ---res/rej--> [idle]
    //   pending + in-flight ---res/rej--> pending + scheduled   // shedule
    
    // Store last successful payload for deduplication
    if (success && this.inFlightPayload != null) {
      this.lastSuccessPayload = this.inFlightPayload;
    }
    
    this.inFlightPayload = null;
    this.lastFlightTimestamp = performance.now();
    this.lastFlightResponse = { success, response };
    if (this.pendingPayload != null) {
      this.scheduleLaunch();
    }
    this.emitStateChange();
    this.onCallbackResponse?.(success, response);
  }

  scheduleLaunch() {
    const timeout = Math.max(this.lastFlightTimestamp + this.interval - performance.now(), this.delay);
    this.pendingTimer = setTimeout(this.launch.bind(this), timeout);
  }

  launch() {
    if (this.pendingPayload == null) {
      return;
    }

    // Clear pending timer
    if (this.pendingTimer != null) {
      clearTimeout(this.pendingTimer);
      this.pendingTimer = null;
    }

    const payload = this.pendingPayload;
    this.inFlightPayload = payload;
    this.pendingPayload = null;
    this.callback(payload).then((response) => {
      this.onCallbackDone({ success: true, response });
    }).catch(() => {
      this.onCallbackDone({ success: false, response: null });
    });
  }

  emitStateChange() {
    this.onStateChange?.(this.inFlightPayload != null, this.pendingPayload != null);
  }

  // last flight is failed, and no pending or in-flight payload
  get needRetry() {
    return this.inFlightPayload == null && this.pendingPayload == null && this.lastFlightResponse?.success === false;
  }

  // Dispose resources (timers, listeners)
  dispose() {
    if (this.pendingTimer != null) {
      clearTimeout(this.pendingTimer);
      this.pendingTimer = null;
    }
    if (this._beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this._beforeUnloadHandler);
      this._beforeUnloadHandler = null;
    }
  }
}

// Simple unit test for Debouncer
async function debouncerUnitTest() {
  console.log('debouncerUnitTest start');

  // Helper to wait
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  // Test 1: rapid pushes -> only last delivered
  const events1: string[] = [];
  const cb1 = async (p: string) => { events1.push(p); await wait(20); return p; };
  const d1 = new Debouncer<string, string>({ callback: cb1, delay: 50, interval: 10 });
  d1.push('A');
  setTimeout(() => d1.push('B'), 10);
  await wait(200);
  console.assert(events1.length === 1 && events1[0] === 'B', 'T1: expected single B');
  d1.dispose();

  // Test 2: simple single push
  const events2: string[] = [];
  const cb2 = async (p: string) => { events2.push(p); await wait(20); return p; };
  const d2 = new Debouncer<string, string>({ callback: cb2, delay: 30, interval: 10 });
  d2.push('C');
  await wait(120);
  console.assert(events2.length === 1 && events2[0] === 'C', 'T2: expected C');
  d2.dispose();

  // Test 3: in-flight then pending should run both in order
  const events3: string[] = [];
  const cb3 = async (p: string) => { events3.push(p); if (p === 'LONG') await wait(150); else await wait(20); return p; };
  const d3 = new Debouncer<string, string>({ callback: cb3, delay: 40, interval: 10 });
  d3.push('LONG');
  // wait until LONG has been launched (delay + small margin) so E becomes pending while LONG is in-flight
  await wait(60);
  d3.push('E'); // while LONG in-flight, E becomes pending
  await wait(400);
  console.assert(events3.length === 2 && events3[0] === 'LONG' && events3[1] === 'E', 'T3: expected LONG then E');
  d3.dispose();

  // Test 4: failure sets needRetry
  const events4: string[] = [];
  const cb4 = async (p: string) => { events4.push(p); if (p === 'FAIL') throw new Error('fail'); await wait(20); return p; };
  const d4 = new Debouncer<string, string>({ callback: cb4, delay: 30, interval: 10 });
  d4.push('FAIL');
  await wait(120);
  console.assert(d4.needRetry === true, 'T4: expected needRetry after failure');
  // push a successful payload to recover
  d4.push('OK');
  await wait(200);
  console.assert(events4.includes('OK'), 'T4: expected OK delivered after retry');
  d4.dispose();

  // Test 5: dispose prevents pending launch
  const events5: string[] = [];
  const cb5 = async (p: string) => { events5.push(p); await wait(20); return p; };
  const d5 = new Debouncer<string, string>({ callback: cb5, delay: 80, interval: 10 });
  d5.push('X');
  d5.dispose();
  await wait(200);
  console.assert(events5.length === 0, 'T5: expected no events after dispose');

  console.log('debouncerUnitTest passed');
  return { events1, events2, events3, events4, events5 };
}

let testStarted = false
export function oneDebouncerUnitTest() {
  if (testStarted) return;
  testStarted = true;
  debouncerUnitTest();
}