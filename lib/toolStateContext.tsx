import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { browser } from 'wxt/browser';
import ExtMessage, { MessageType } from '@/entrypoints/types.ts';
import { type ToolState as DbToolState } from '@/utils/db';

// Use the ToolState type from our db.ts file
type ToolState = DbToolState;

// Define the structure for the app state
interface AppState {
  toolState: ToolState;
  currentSelectedTool: string | null;
}

// Define the context type
interface ToolStateContextType {
  toolState: ToolState;
  currentSelectedTool: string | null;
  updateToolState: <T extends keyof ToolState>(
    tool: T,
    state: Partial<ToolState[T]>
  ) => void;
  setCurrentSelectedTool: (toolId: string | null) => void;
}

// Create the context with a default value
const ToolStateContext = createContext<ToolStateContextType | undefined>(undefined);

// Default state for all tools
const defaultToolState: ToolState = {
  beautifyJSON: {
    input: '',
    parsedData: null,
    viewMode: 'tree',
  },
  urlEncoder: {
    input: '',
    output: '',
    mode: 'encode',
  },
  convertToReadableDate: {
    input: '',
  },
  takeScreenshot: {
    capturedImage: '',
  },
  // Add other tools with their default states
};

// Save state to IndexedDB via background script
const saveState = async (state: AppState): Promise<void> => {
  try {
    const message = new ExtMessage(MessageType.saveAppState);
    message.content = JSON.stringify(state); // Cast to any to avoid type issues
    
    return new Promise(async (resolve, reject) => {
      browser.runtime.sendMessage(message, (response) => {
        if (response && response.success) {
          resolve();
        } else {
          console.error('Failed to save state:', response?.error);
          reject(response?.error || 'Unknown error');
        }
      });
    });
  } catch (error) {
    console.error('Failed to save state:', error);
  }
};

// Load state from IndexedDB via background script
const loadState = async (): Promise<AppState | null> => {
  try {
    const message = new ExtMessage(MessageType.loadAppState);
    
    return new Promise((resolve, reject) => {
      browser.runtime.sendMessage(message, (response) => {
        if (response && response.success && response.state) {
          resolve(response.state as AppState);
        } else {
          console.error('Failed to load state:', response?.error);
          resolve(null); // Return null instead of rejecting to handle first-time use case
        }
      });
    });
  } catch (error) {
    console.error('Failed to load state:', error);
    return null;
  }
};

// Provider component
export const ToolStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toolState, setToolState] = useState<ToolState>(defaultToolState);
  const [currentSelectedTool, setCurrentSelectedTool] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load state from IndexedDB on component mount
  useEffect(() => {
    const loadSavedState = async () => {
      try {
        const savedState = await loadState();
        if (savedState) {
          setToolState(savedState.toolState);
          setCurrentSelectedTool(savedState.currentSelectedTool);
        }
        setIsInitialized(true);
      } catch (error) {
        console.error('Error loading saved state:', error);
        setIsInitialized(true);
      }
    };

    loadSavedState();
  }, []);

  // Save state to browser.storage.local whenever it changes
  useEffect(() => {
    if (isInitialized) {
      const appState: AppState = {
        toolState,
        currentSelectedTool
      };
      saveState(appState);
    }
  }, [toolState, currentSelectedTool, isInitialized]);

  // Function to update a specific tool's state
  const updateToolState = <T extends keyof ToolState>(
    tool: T,
    state: Partial<ToolState[T]>
  ) => {
    setToolState(prevState => ({
      ...prevState,
      [tool]: {
        ...prevState[tool],
        ...state,
      },
    }));
  };

  return (
    <ToolStateContext.Provider value={{
      toolState,
      currentSelectedTool,
      updateToolState,
      setCurrentSelectedTool
    }}>
      {children}
    </ToolStateContext.Provider>
  );
};

// Custom hook to use the tool state
export const useToolState = () => {
  const context = useContext(ToolStateContext);
  if (context === undefined) {
    throw new Error('useToolState must be used within a ToolStateProvider');
  }
  return context;
};
