// Main application entry point.
import { setState, getInitialState } from './state.js';
import { renderAll } from './ui.js';
import { initEventListeners } from './events.js';
// import { loadProject } from './db.js';

function init() {
    console.log("UX Architect App Initializing...");
    
    // For now, we start with a fresh state.
    // Later, this will be replaced with loadProject()
    const initialState = getInitialState();
    setState(initialState, false); // Initial state should not be part of history
    
    initEventListeners();
    
    renderAll();
    
    console.log("Application ready.");
}

// Wait for the DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', init);
