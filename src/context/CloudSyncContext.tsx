import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { getCloudSyncUtil, CloudSyncUtil } from '../data/cloudSync';
import { Modal, Typography } from '@arco-design/web-react';

const { Text } = Typography;

export type CloudSyncState = 'initial-loading' | 'saving' | 'saved' | 'error';

interface CloudSyncContextType {
  // Unified sync state
  syncState: CloudSyncState;
  // Current experiment ID
  experimentId: number | null;
  // CloudSyncUtil instance
  util: CloudSyncUtil | null;
  // Initialize util for an experiment and load data from cloud
  initializeExperiment: (experimentId: number) => Promise<any>;
  // Save values (will be debounced)
  save: (values: any) => void;
}

const CloudSyncContext = createContext<CloudSyncContextType | undefined>(undefined);

export const CloudSyncProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [syncState, setSyncState] = useState<CloudSyncState>('saved');
  const [experimentId, setExperimentId] = useState<number | null>(null);
  const [util, setUtil] = useState<CloudSyncUtil | null>(null);
  
  // Use ref to track initialization in progress (state is async and causes race condition)
  const initializingRef = React.useRef<number | null>(null);

  const initializeExperiment = useCallback(async (expId: number) => {
    console.log('[CloudSync] initializeExperiment called with expId:', expId, 'current experimentId:', experimentId, 'util exists:', !!util, 'initializingRef:', initializingRef.current);
    
    // Check ref instead of state to prevent race condition
    if (initializingRef.current === expId) {
      console.log('[CloudSync] Already initializing this experiment, skipping');
      return;
    }
    
    if (expId === experimentId && util) {
      // Already initialized for this experiment
      console.log('[CloudSync] Already initialized, returning early');
      return;
    }

    // Mark as initializing
    initializingRef.current = expId;
    setExperimentId(expId);
    setSyncState('initial-loading');

    console.log('[CloudSync] Creating new util for experiment:', expId);
    
    // Create util with callbacks that update context state
    const newCloudSyncUtil = getCloudSyncUtil(expId, {
      onStateChange: (inFlight, pending) => {
        // Update syncState when debouncer state changes
        if (inFlight || pending) {
          setSyncState('saving');
        }
      },
      onSaveComplete: (success) => {
        // Update state based on save result
        setSyncState(success ? 'saved' : 'error');
      },
      onVersionConflict: (cloudTimestamp, localTimestamp) => {
        return new Promise((resolve) => {
          Modal.confirm({
            title: 'Version Conflict',
            content: (
              <Text>
                This experiment has been updated elsewhere since your last save. Which version do you want to keep?
                <ul>
                  <li>Cloud version: {cloudTimestamp}.</li>
                  <li>Local version: {localTimestamp}.</li>
                </ul>
                Please do not edit one experiment from multiple devices or browser tabs simultaneously.
              </Text>
            ),
            onOk: () => resolve(true),
            onCancel: () => resolve(false),
            okText: 'Overwrite Remote',
            cancelText: 'Cancel Save',
          });
        });
      }
    });

    setUtil(newCloudSyncUtil);

    // Load from cloud using the util instance directly (avoids race condition)
    try {
      const result = await newCloudSyncUtil.initLoad();
      setSyncState('saved');
      // Clear initializing flag on success
      initializingRef.current = null;
      return result;
    } catch (error) {
      setSyncState('error');
      // Clear initializing flag on error
      initializingRef.current = null;
      throw error;
    }
  }, [experimentId, util]);

  const save = useCallback((values: any) => {
    if (util) {
      // Convert to JSON string format: {values: ...} for proper deduplication
      const payload = JSON.stringify({ values });
      util.save(payload);
    }
  }, [util]);

  return (
    <CloudSyncContext.Provider value={{ 
      syncState,
      experimentId,
      util,
      initializeExperiment,
      save
    }}>
      {children}
    </CloudSyncContext.Provider>
  );
};

export const useCloudSync = () => {
  const context = useContext(CloudSyncContext);
  if (context === undefined) {
    throw new Error('useCloudSync must be used within a CloudSyncProvider');
  }
  return context;
};
