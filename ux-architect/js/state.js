// Manages the application's state.
import { saveProject } from './db.js';

let state = {};
let history = [];
let historyIndex = -1;

// --- Debounce helper for saving ---
let saveTimeout;
function debouncedSave(stateToSave) {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        saveProject(stateToSave);
    }, 500); // Wait 500ms after the last change to save
}

// --- State Initialization ---
export function getInitialState() {
    const initialFlowId = `flow_${Date.now()}`;
    return {
        projectName: 'Untitled Project',
        projectDescription: 'A new user experience plan.',
        personas: [],
        sitemap: [],
        userFlows: [{
            id: initialFlowId,
            name: 'Main Flow',
            description: '',
            personaId: null,
            steps: [],
            visualLayout: { nodes: [], hubs: [], connections: [] }
        }],
        activeFlowId: initialFlowId,
        selectedItemId: null,
        selectedItemType: null, // 'persona', 'sitemap', 'node', 'hub', or 'connection'
        canvas: {
            pan: { x: 0, y: 0 },
            zoom: 1,
        }
    };
}

// --- State Accessors ---
export function getState() {
    return state;
}

export function getActiveFlow() {
    if (!state.activeFlowId) return null;
    return state.userFlows.find(flow => flow.id === state.activeFlowId);
}

// --- State Mutators & History ---
export function setState(newState, recordHistory = true) {
    if (recordHistory) {
        if (historyIndex < history.length - 1) {
            history = history.slice(0, historyIndex + 1);
        }
        history.push(JSON.parse(JSON.stringify(state)));
        historyIndex++;
        if(history.length > 50) {
            history.shift();
            historyIndex--;
        }
    }
    state = newState;
    if(state.userFlows.length > 0 && !state.activeFlowId) {
        state.activeFlowId = state.userFlows[0].id;
    }
    
    // Auto-save on state change
    debouncedSave(state);
}

// --- Domain-specific Actions ---

export function addHubToConnection(connectionId, x, y) {
    const activeFlow = getActiveFlow();
    if (!activeFlow) return;
    const { pan, zoom } = state.canvas;

    const originalConnection = activeFlow.visualLayout.connections.find(c => c.id === connectionId);
    if (!originalConnection) return;

    const newHub = {
        id: `hub_${Date.now()}`,
        x: (x - pan.x) / zoom,
        y: (y - pan.y) / zoom
    };
    activeFlow.visualLayout.hubs.push(newHub);

    addConnection(originalConnection.from, newHub.id, true);
    addConnection(newHub.id, originalConnection.to, true);
    deleteConnection(connectionId, false);

    setState(state);
}

export function addConnection(fromId, toId, isHubSource = false) {
    const activeFlow = getActiveFlow();
    if (!activeFlow || fromId === toId) return;

    const exists = activeFlow.visualLayout.connections.some(c => c.from === fromId && c.to === toId);
    if (exists) return;

    const newConnection = {
        id: `conn_${Date.now()}`,
        from: fromId,
        to: toId,
        label: isHubSource ? 'Condition' : 'User action'
    };
    activeFlow.visualLayout.connections.push(newConnection);
    setState(state);
}

export function deleteConnection(connectionId, recordHistory = true) {
    const activeFlow = getActiveFlow();
    if (!activeFlow) return;
    activeFlow.visualLayout.connections = activeFlow.visualLayout.connections.filter(c => c.id !== connectionId);
    if (recordHistory) setState(state);
}

export function setActiveFlow(flowId) {
    state.activeFlowId = flowId;
    setState(state, false);
}

export function addUserFlow(name) {
    const newFlow = {
        id: `flow_${Date.now()}`,
        name,
        description: '',
        personaId: null,
        steps: [],
        visualLayout: { nodes: [], hubs: [], connections: [] }
    };
    state.userFlows.push(newFlow);
    state.activeFlowId = newFlow.id;
    setState(state);
    return newFlow;
}

export function setSelectedItem(id, type) {
    state.selectedItemId = id;
    state.selectedItemType = type;
    setState(state, false); 
}

export function updateItemDetails(id, type, updatedDetails) {
    let item;
    if (type === 'persona') {
        item = state.personas.find(p => p.id === id);
    } else if (type === 'sitemap') {
        item = state.sitemap.find(s => s.id === id);
    } else if (type === 'connection') {
        const activeFlow = getActiveFlow();
        if (activeFlow) item = activeFlow.visualLayout.connections.find(c => c.id === id);
    }
    
    if (item) {
        Object.assign(item, updatedDetails);
        setState(state);
    }
}

export function addPersona(name, description) {
    const newPersona = { id: `persona_${Date.now()}`, name, description };
    state.personas.push(newPersona);
    setState(state);
    return newPersona;
}

export function addSitemapPage(name, parentId = null, personaIds = []) {
    const newPage = {
        id: `page_${Date.now()}`,
        name,
        path: `/${name.toLowerCase().replace(/\s+/g, '-')}`,
        parentId,
        description: '',
        personaIds: personaIds
    };
    state.sitemap.push(newPage);
    setState(state);
    return newPage;
}

export function addNodeToFlow(pageId, x, y) {
    const activeFlow = getActiveFlow();
    if (!activeFlow) return;
    const { pan, zoom } = state.canvas;

    const newStep = { stepId: `step_${Date.now()}`, pageId: pageId, action: "User interacts with this page." };
    activeFlow.steps.push(newStep);

    const newNode = {
        nodeId: `vis_node_${Date.now()}`,
        stepId: newStep.stepId,
        x: (x - pan.x) / zoom,
        y: (y - pan.y) / zoom,
    };
    activeFlow.visualLayout.nodes.push(newNode);
    setState(state);
}

export function updateElementPosition(elementId, x, y, recordHistory = true) {
    const activeFlow = getActiveFlow();
    if (!activeFlow) return;
    let element = activeFlow.visualLayout.nodes.find(n => n.nodeId === elementId);
    if (!element) {
        element = activeFlow.visualLayout.hubs.find(h => h.id === elementId);
    }
    if (element) {
        element.x = x;
        element.y = y;
        setState(state, recordHistory);
    }
}
