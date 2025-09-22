// Contains all event listeners for the application.
import { getState, setState, setSelectedItem, updateItemDetails, addPersona, addSitemapPage, addNodeToFlow, updateElementPosition, addUserFlow, setActiveFlow, addConnection, getActiveFlow, deleteConnection, addHubToConnection } from './state.js';
import { renderAll, createModal, closeModal, createPreferencesModal } from './ui.js';
import { exportStateAsJson } from './export.js';

let isDrawingConnection = false;
let isDragging = false;
let isPanning = false;
let activeDragId = null;
let tempConnectionLine = null;

export function initEventListeners() {
    document.getElementById('project-title').addEventListener('click', handleProjectTitleClick);
    document.getElementById('preferences-btn').addEventListener('click', handlePreferencesClick);
    document.getElementById('personas-list').addEventListener('click', (e) => handleItemSelection(e, 'persona'));
    const sitemapTree = document.getElementById('sitemap-tree');
    sitemapTree.addEventListener('click', (e) => handleItemSelection(e, 'sitemap'));
    sitemapTree.addEventListener('dragstart', handleSitemapDragStart);
    document.getElementById('add-persona-btn').addEventListener('click', handleAddPersona);
    document.getElementById('add-sitemap-page-btn').addEventListener('click', handleAddSitemapPage);
    const inspectorContent = document.getElementById('inspector-content');
    inspectorContent.addEventListener('input', handleInspectorInput);
    inspectorContent.addEventListener('change', handleInspectorChange);
    inspectorContent.addEventListener('click', handleInspectorClick);
    const canvasContainer = document.getElementById('canvas-container');
    canvasContainer.addEventListener('dragover', handleCanvasDragOver);
    canvasContainer.addEventListener('drop', handleCanvasDrop);
    canvasContainer.addEventListener('mousedown', handleCanvasMouseDown);
    canvasContainer.addEventListener('click', handleCanvasClick);
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.getElementById('add-flow-btn').addEventListener('click', handleAddFlow);
    document.getElementById('flow-selector').addEventListener('change', handleFlowChange);
}

// --- MODAL & DATA MANAGEMENT HANDLERS ---
function handlePreferencesClick() {
    createPreferencesModal();
    document.getElementById('close-preferences-btn').addEventListener('click', closeModal);
    document.getElementById('export-json-btn').addEventListener('click', exportStateAsJson);
    document.getElementById('import-json-btn').addEventListener('click', () => document.getElementById('import-file-input').click());
    document.getElementById('import-file-input').addEventListener('change', handleImportFile);
    document.getElementById('pref-project-name').addEventListener('input', (e) => updateProjectDetail('projectName', e.target.value));
    document.getElementById('pref-project-desc').addEventListener('input', (e) => updateProjectDetail('projectDescription', e.target.value));
}

function handleImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const importedData = JSON.parse(event.target.result);
            if (importedData.projectInfo && importedData.personas && importedData.sitemap && importedData.userFlows) {
                const newState = {
                    projectName: importedData.projectInfo.projectName,
                    projectDescription: importedData.projectInfo.projectDescription,
                    personas: importedData.personas,
                    sitemap: importedData.sitemap,
                    userFlows: importedData.userFlows,
                    activeFlowId: importedData.userFlows[0]?.id || null,
                    selectedItemId: null,
                    selectedItemType: null,
                    canvas: { pan: { x: 0, y: 0 }, zoom: 1 }
                };
                setState(newState);
                closeModal();
                renderAll();
            } else {
                alert('Invalid project file format.');
            }
        } catch (err) {
            alert('Error parsing JSON file.');
            console.error(err);
        }
    };
    reader.readAsText(file);
}

function updateProjectDetail(key, value) {
    const state = getState();
    state[key] = value;
    setState(state, false);
    if (key === 'projectName') {
        document.getElementById('project-title').textContent = value;
    }
}

// --- CANVAS HANDLERS ---
function handleCanvasMouseDown(e) {
    const target = e.target;
    const draggableTarget = target.closest('.node, .hub');

    if (target.matches('.node-handle, .hub-handle')) {
        isDrawingConnection = true;
        activeDragId = target.dataset.id;
        tempConnectionLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        tempConnectionLine.setAttribute('class', 'temp-connection');
        tempConnectionLine.setAttribute('marker-end', 'url(#arrowhead)');
        document.getElementById('canvas-svg').appendChild(tempConnectionLine);
        e.stopPropagation();

    } else if (draggableTarget) {
        isDragging = true;
        activeDragId = draggableTarget.dataset.id;
        const state = getState();
        const { zoom } = state.canvas;
        const startPos = { x: e.clientX, y: e.clientY };
        
        const activeFlow = getActiveFlow();
        let element = activeFlow.visualLayout.nodes.find(n => n.nodeId === activeDragId) || activeFlow.visualLayout.hubs.find(h => h.id === activeDragId);
        const initialPos = { x: element.x, y: element.y };

        document.onmousemove_drag = (moveEvent) => {
            const dx = (moveEvent.clientX - startPos.x) / zoom;
            const dy = (moveEvent.clientY - startPos.y) / zoom;
            updateElementPosition(activeDragId, initialPos.x + dx, initialPos.y + dy, false);
            renderAll();
        };

    } else {
        isPanning = true;
        const state = getState();
        const startPos = { x: e.clientX, y: e.clientY };
        const initialPan = { ...state.canvas.pan };
        
        document.onmousemove_pan = (moveEvent) => {
            const dx = moveEvent.clientX - startPos.x;
            const dy = moveEvent.clientY - startPos.y;
            state.canvas.pan.x = initialPan.x + dx;
            state.canvas.pan.y = initialPan.y + dy;
            setState(state, false);
            renderAll();
        };
    }
}

function handleCanvasClick(e) {
    if (e.target.classList.contains('connection-interaction-area')) {
        const connectionId = e.target.dataset.id;
        const activeFlow = getActiveFlow();
        const conn = activeFlow.visualLayout.connections.find(c => c.id === connectionId);
        
        const fromIsNode = activeFlow.visualLayout.nodes.some(n => n.nodeId === conn.from);
        const toIsNode = activeFlow.visualLayout.nodes.some(n => n.nodeId === conn.to);
        
        if (fromIsNode && toIsNode) {
            addHubToConnection(connectionId, e.clientX, e.clientY);
        } else {
             setSelectedItem(connectionId, 'connection');
             renderAll();
        }
    }
}

function handleGlobalMouseMove(e) {
    if (document.onmousemove_drag) document.onmousemove_drag(e);
    if (document.onmousemove_pan) document.onmousemove_pan(e);

    if (isDrawingConnection) {
        const state = getState();
        const activeFlow = getActiveFlow();
        const allElements = [...activeFlow.visualLayout.nodes, ...activeFlow.visualLayout.hubs];
        const startElement = allElements.find(el => (el.nodeId || el.id) === activeDragId);
        const startEl = document.getElementById(activeDragId);
        if (!startEl || !startElement) return;

        const isHub = startEl.classList.contains('hub');
        const startPos = {
            x: startElement.x + (isHub ? startEl.offsetWidth / 2 : startEl.offsetWidth),
            y: startElement.y + startEl.offsetHeight / 2
        };

        const { pan, zoom } = state.canvas;
        const canvasRect = document.getElementById('canvas-container').getBoundingClientRect();
        const endX = (e.clientX - canvasRect.left - pan.x) / zoom;
        const endY = (e.clientY - canvasRect.top - pan.y) / zoom;
        tempConnectionLine.setAttribute('d', `M ${startPos.x} ${startPos.y} L ${endX} ${endY}`);
    }
}

function handleGlobalMouseUp(e) {
    if (isDrawingConnection) {
        const endTarget = e.target.closest('.node, .hub');
        if (endTarget) {
            const endElementId = endTarget.dataset.id;
            const isHubSource = activeDragId && activeDragId.startsWith('hub');
            addConnection(activeDragId, endElementId, isHubSource);
        }
        if (tempConnectionLine) tempConnectionLine.remove();
        renderAll();
    }
    
    if (isDragging) {
        setState(getState());
    }

    isDrawingConnection = false;
    isDragging = false;
    isPanning = false;
    activeDragId = null;
    tempConnectionLine = null;
    document.onmousemove_drag = null;
    document.onmousemove_pan = null;
}

function handleInspectorClick(e) {
    if (e.target.id === 'delete-connection-btn') {
        const { selectedItemId } = getState();
        if (confirm('Are you sure you want to delete this connection?')) {
            deleteConnection(selectedItemId);
            setSelectedItem(null, null);
            renderAll();
        }
    }
}

function handleInspectorInput(e) {
    if (e.target.type === 'checkbox') return;
    const { selectedItemId, selectedItemType } = getState();
    if (!selectedItemId || !selectedItemType) return;
    const property = e.target.dataset.property;
    const value = e.target.value;
    if (property) {
        updateItemDetails(selectedItemId, selectedItemType, { [property]: value });
        if (selectedItemType === 'connection' || property === 'name') {
            renderAll();
        }
    }
}

function handleSitemapDragStart(e) {
    const target = e.target.closest('[data-id]');
    if (target) {
        e.dataTransfer.setData('text/plain', target.dataset.id);
        e.dataTransfer.effectAllowed = 'copy';
    }
}

function handleCanvasDragOver(e) { e.preventDefault(); }

function handleCanvasDrop(e) {
    e.preventDefault();
    const pageId = e.dataTransfer.getData('text/plain');
    if (!pageId) return;
    const canvasRect = e.currentTarget.getBoundingClientRect();
    addNodeToFlow(pageId, e.clientX - canvasRect.left, e.clientY - canvasRect.top);
    renderAll();
}

function handleItemSelection(e, type) {
    const target = e.target.closest('[data-id]');
    if (target) {
        const id = target.dataset.id;
        setSelectedItem(id, type);
        renderAll();
    }
}

function handleInspectorChange(e) {
    const { selectedItemId, selectedItemType } = getState();
    if (!selectedItemId || !selectedItemType) return;
    if (e.target.name === 'persona-link' && selectedItemType === 'sitemap') {
        const linkedPersonaIds = Array.from(document.querySelectorAll('#inspector-persona-links input:checked')).map(input => input.value);
        updateItemDetails(selectedItemId, 'sitemap', { personaIds: linkedPersonaIds });
        renderAll();
    }
}

function handleAddFlow() {
    const title = 'Create New User Flow';
    const body = `
        <div>
            <label for="flow-name" class="block text-sm font-medium text-gray-700 mb-1">Flow Name</label>
            <input type="text" id="flow-name" placeholder="e.g., Checkout Process, Onboarding" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary">
        </div>
    `;
    const footerButtons = [
        { id: 'cancel-flow-btn', text: 'Cancel', class: 'bg-white hover:bg-gray-100 text-gray-700 border' },
        { id: 'save-flow-btn', text: 'Save Flow', class: 'bg-brand-primary hover:bg-blue-800 text-white' }
    ];
    createModal(title, body, footerButtons);
    document.getElementById('save-flow-btn').addEventListener('click', () => {
        const name = document.getElementById('flow-name').value.trim();
        if (name) {
            addUserFlow(name);
            renderAll();
            closeModal();
        } else {
            document.getElementById('flow-name').focus();
            document.getElementById('flow-name').classList.add('border-red-500');
        }
    });
    document.getElementById('cancel-flow-btn').addEventListener('click', closeModal);
}

function handleFlowChange(e) {
    const newFlowId = e.target.value;
    setActiveFlow(newFlowId);
    renderAll();
}

function handleProjectTitleClick(e) {
    const titleElement = e.target;
    const currentTitle = titleElement.textContent;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentTitle;
    input.className = 'text-xl font-semibold text-gray-800 bg-gray-100 border border-brand-primary rounded-md px-1';
    titleElement.replaceWith(input);
    input.focus();
    input.select();
    const save = () => {
        const state = getState();
        state.projectName = input.value || 'Untitled Project';
        setState(state);
        input.replaceWith(titleElement);
        titleElement.textContent = state.projectName;
    };
    input.addEventListener('blur', save);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') input.blur();
        if (e.key === 'Escape') {
            input.value = currentTitle;
            input.blur();
        }
    });
}

function handleAddPersona() {
    const title = 'Create New Persona';
    const body = `
        <div class="space-y-4">
            <div>
                <label for="persona-name" class="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" id="persona-name" placeholder="e.g., Admin, Guest User" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary">
            </div>
            <div>
                <label for="persona-desc" class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea id="persona-desc" rows="3" placeholder="Describe their goals and motivations..." class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary"></textarea>
            </div>
        </div>
    `;
    const footerButtons = [
        { id: 'cancel-persona-btn', text: 'Cancel', class: 'bg-white hover:bg-gray-100 text-gray-700 border' },
        { id: 'save-persona-btn', text: 'Save Persona', class: 'bg-brand-primary hover:bg-blue-800 text-white' }
    ];
    createModal(title, body, footerButtons);
    document.getElementById('save-persona-btn').addEventListener('click', () => {
        const name = document.getElementById('persona-name').value.trim();
        const description = document.getElementById('persona-desc').value.trim();
        if (name) {
            addPersona(name, description);
            renderAll();
            closeModal();
        } else {
            document.getElementById('persona-name').focus();
            document.getElementById('persona-name').classList.add('border-red-500');
        }
    });
    document.getElementById('cancel-persona-btn').addEventListener('click', closeModal);
}

function handleAddSitemapPage() {
    const { personas } = getState();
    const personaCheckboxes = personas.length > 0 ? personas.map(p => `
        <div class="flex items-center">
            <input id="persona-link-modal-${p.id}" name="persona-link-modal" type="checkbox" value="${p.id}" class="h-4 w-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary">
            <label for="persona-link-modal-${p.id}" class="ml-2 block text-sm text-gray-900">${p.name}</label>
        </div>
    `).join('') : '<p class="text-sm text-gray-500">No personas exist to link it.</p>';
    const title = 'Create New Sitemap Page';
    const body = `
         <div class="space-y-4">
            <div>
                <label for="page-name" class="block text-sm font-medium text-gray-700 mb-1">Page Name</label>
                <input type="text" id="page-name" placeholder="e.g., Dashboard, Settings" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Link to Personas (optional)</label>
                <div class="space-y-2">${personaCheckboxes}</div>
            </div>
        </div>
    `;
     const footerButtons = [
        { id: 'cancel-page-btn', text: 'Cancel', class: 'bg-white hover:bg-gray-100 text-gray-700 border' },
        { id: 'save-page-btn', text: 'Save Page', class: 'bg-brand-primary hover:bg-blue-800 text-white' }
    ];
    createModal(title, body, footerButtons);
    document.getElementById('save-page-btn').addEventListener('click', () => {
        const name = document.getElementById('page-name').value.trim();
        const linkedPersonaIds = Array.from(document.querySelectorAll('input[name="persona-link-modal"]:checked')).map(input => input.value);
        if(name) {
            addSitemapPage(name, null, linkedPersonaIds);
            renderAll();
            closeModal();
        } else {
             document.getElementById('page-name').focus();
            document.getElementById('page-name').classList.add('border-red-500');
        }
    });
    document.getElementById('cancel-page-btn').addEventListener('click', closeModal);
}
