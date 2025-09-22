// Main application entry point.
import { setState } from './state.js';
import { renderAll } from './ui.js';
import { initEventListeners } from './events.js';
import { loadProject } from './db.js';

async function init() {
    console.log("UX Architect App Initializing...");
    
    // Load the last saved project from IndexedDB
    const initialState = await loadProject();
    setState(initialState, false); // Initial state should not be part of history
    
    initEventListeners();
    
    renderAll();
    
    console.log("Application ready.");
}

// Wait for the DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', init);
