import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the structure of our tool state
interface ToolState {
  beautifyJSON: {
	input: string;
	parsedData: any;
	viewMode: 'tree' | 'text';
  };
  urlEncoder: {
	input: string;
	output: string;
	mode: 'encode' | 'decode';
  };
  // Add other tools here as needed
}

// Define the context type
interface ToolStateContextType {
  toolState: ToolState;
  updateToolState: <T extends keyof ToolState>(
	tool: T,
	state: Partial<ToolState[T]>
  ) => void;
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
  // Add other tools with their default states
};

// Provider component
export const ToolStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toolState, setToolState] = useState<ToolState>(defaultToolState);

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
	<ToolStateContext.Provider value={{ toolState, updateToolState }}>
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
