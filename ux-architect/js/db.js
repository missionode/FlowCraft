// Manages IndexedDB interactions.
import { getInitialState } from './state.js';

const DB_NAME = 'UXArchitectDB';
const STORE_NAME = 'projects';
const DB_VERSION = 1;
let db;

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const dbInstance = event.target.result;
            if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
                dbInstance.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log("Database initialized successfully.");
            resolve(db);
        };

        request.onerror = (event) => {
            console.error("Database error:", event.target.errorCode);
            reject(event.target.errorCode);
        };
    });
}

export async function saveProject(state) {
    if (!db) await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put({ id: 'current_project', ...state });
        
        request.onsuccess = () => resolve();
        request.onerror = (event) => {
            console.error("Error saving project:", event.target.error);
            reject(event.target.error);
        };
    });
}

export async function loadProject() {
    if (!db) await initDB();
    return new Promise((resolve) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get('current_project');

        request.onsuccess = (event) => {
            if (event.target.result) {
                const projectData = event.target.result;
                delete projectData.id; // Remove the keyPath id
                resolve(projectData);
            } else {
                // No project found, resolve with a fresh initial state
                resolve(getInitialState());
            }
        };

        request.onerror = (event) => {
            console.error("Error loading project:", event.target.error);
            // On error, still resolve with a fresh state to allow the app to run
            resolve(getInitialState());
        };
    });
}
