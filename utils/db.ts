import Dexie, { type Table } from 'dexie';

// Define the structure of our tool state
export interface ToolState {
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

// Define the structure for the app state
export interface AppState {
  id?: number; // Primary key, auto-incremented
  toolState: ToolState;
  lastSelectedTool: string | null;
  updatedAt: Date;
}

export class DevToolsDatabase extends Dexie {
  // 'appState' is the name of our object store
  appState!: Table<AppState>;

  constructor() {
    super('devtools-state');
    this.version(1).stores({
      // Schema definition. '++id' means auto-incrementing primary key
      // 'updatedAt' is an index for fast lookups by date
      appState: '++id, updatedAt',
    });
  }
}

// Create and export a single instance of the database
export const db = new DevToolsDatabase();
