// Handles all DOM manipulations and UI updates.
import { getState, getActiveFlow } from './state.js';

const elements = {
    projectTitle: document.getElementById('project-title'),
    personaslist: document.getElementById('personas-list'),
    sitemapTree: document.getElementById('sitemap-tree'),
    flowSelector: document.getElementById('flow-selector'),
    nodesContainer: document.getElementById('nodes-container'),
    svgCanvas: document.getElementById('canvas-svg'),
    inspectorContent: document.getElementById('inspector-content'),
    modalContainer: document.getElementById('modal-container'),
};

function renderPersonas() {
    const { personas, selectedItemId, selectedItemType } = getState();
    elements.personaslist.innerHTML = personas.map(p => {
        const isSelected = selectedItemId === p.id && selectedItemType === 'persona';
        return `
        <li data-id="${p.id}" class="p-2 rounded-md hover:bg-gray-100 cursor-pointer text-sm ${isSelected ? 'bg-brand-secondary text-brand-primary font-semibold' : ''}">
            ${p.name}
        </li>
    `}).join('') || `<li class="text-xs text-gray-400 p-2">No personas created yet.</li>`;
}

function renderSitemap() {
    const { sitemap, personas, selectedItemId, selectedItemType } = getState();
    const buildTree = (parentId = null) => {
        const children = sitemap.filter(page => page.parentId === parentId);
        if (children.length === 0) return '';
        return `<ul class="${parentId ? 'pl-4 border-l-2 border-gray-200' : ''}">
            ${children.map(page => {
                const isSelected = selectedItemId === page.id && selectedItemType === 'sitemap';
                const personaTags = (page.personaIds || [])
                    .map(pId => personas.find(p => p.id === pId))
                    .filter(Boolean)
                    .map(p => `<span class="inline-block bg-blue-100 text-blue-800 text-xs font-semibold ml-2 px-2 py-0.5 rounded-full" title="${p.name}">${p.name.charAt(0)}</span>`)
                    .join('');

                return `
                <li data-id="${page.id}" draggable="true" class="p-1 rounded-md hover:bg-gray-100 cursor-pointer text-sm group relative ${isSelected ? 'bg-brand-secondary text-brand-primary font-semibold' : ''}">
                    <div class="flex items-center">
                        <i class="fas fa-file-alt text-gray-400 mr-2"></i>
                        <span>${page.name}</span>
                        <div class="flex-grow"></div>
                        ${personaTags}
                    </div>
                    ${buildTree(page.id)}
                </li>
            `}).join('')}
        </ul>`;
    };
    elements.sitemapTree.innerHTML = buildTree() || `<div class="text-xs text-gray-400 p-2">No sitemap pages created yet.</div>`;
}

function renderFlowSelector() {
    const { userFlows, activeFlowId } = getState();
     elements.flowSelector.innerHTML = userFlows.map(flow => `
        <option value="${flow.id}" ${flow.id === activeFlowId ? 'selected' : ''}>
            ${flow.name}
        </option>
    `).join('');
}

function renderInspector() {
    const { selectedItemId, selectedItemType, personas, sitemap } = getState();
    const activeFlow = getActiveFlow();

    if (!selectedItemId || !selectedItemType) {
        elements.inspectorContent.innerHTML = `<div class="text-center text-gray-500 italic mt-8">Select an item to see its properties.</div>`;
        return;
    }

    let item, html;
    if (selectedItemType === 'persona') {
        item = personas.find(p => p.id === selectedItemId);
        if (!item) return;
        html = `
            <div class="space-y-4">
                <h3 class="text-lg font-bold text-gray-900 flex items-center"><i class="fas fa-user-circle text-gray-400 mr-3"></i>Persona Details</h3>
                <div><label for="inspector-name" class="block text-sm font-medium text-gray-700 mb-1">Name</label><input type="text" id="inspector-name" data-property="name" value="${item.name}" class="w-full form-input"></div>
                <div><label for="inspector-desc" class="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea id="inspector-desc" data-property="description" rows="5" class="w-full form-input">${item.description}</textarea></div>
            </div>`;
    } else if (selectedItemType === 'sitemap') {
        item = sitemap.find(s => s.id === selectedItemId);
        if (!item) return;
        const personaCheckboxes = personas.map(p => `
            <div class="flex items-center">
                <input id="persona-link-${p.id}" name="persona-link" type="checkbox" value="${p.id}" ${(item.personaIds || []).includes(p.id) ? 'checked' : ''} class="h-4 w-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary">
                <label for="persona-link-${p.id}" class="ml-2 block text-sm text-gray-900">${p.name}</label>
            </div>
        `).join('');
        html = `
            <div class="space-y-4">
                <h3 class="text-lg font-bold text-gray-900 flex items-center"><i class="fas fa-file-alt text-gray-400 mr-3"></i>Page Details</h3>
                <div><label for="inspector-name" class="block text-sm font-medium text-gray-700 mb-1">Page Name</label><input type="text" id="inspector-name" data-property="name" value="${item.name}" class="w-full form-input"></div>
                <div><label for="inspector-desc" class="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea id="inspector-desc" data-property="description" rows="4" class="w-full form-input">${item.description || ''}</textarea></div>
                <div><label class="block text-sm font-medium text-gray-700 mb-2">Linked Personas</label><div id="inspector-persona-links" class="space-y-2">${personaCheckboxes || '<p class="text-xs text-gray-500">No personas exist to link.</p>'}</div></div>
            </div>`;
    } else if (selectedItemType === 'connection' && activeFlow) {
        item = activeFlow.visualLayout.connections.find(c => c.id === selectedItemId);
        if (!item) return;
        html = `
            <div class="space-y-4">
                <h3 class="text-lg font-bold text-gray-900 flex items-center"><i class="fas fa-long-arrow-alt-right text-gray-400 mr-3"></i>Connection Details</h3>
                <div><label for="inspector-label" class="block text-sm font-medium text-gray-700 mb-1">Label (Condition)</label><input type="text" id="inspector-label" data-property="label" value="${item.label}" class="w-full form-input"></div>
                <button id="delete-connection-btn" class="w-full bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"><i class="fas fa-trash mr-2"></i>Delete Connection</button>
            </div>`;
    }
    
    elements.inspectorContent.innerHTML = html;
    elements.inspectorContent.querySelectorAll('input, textarea, select').forEach(el => {
        el.classList.add('px-3', 'py-2', 'border', 'border-gray-300', 'rounded-md', 'shadow-sm', 'focus:outline-none', 'focus:ring-brand-primary', 'focus:border-brand-primary');
    });
}


function renderNodesAndHubs() {
    const activeFlow = getActiveFlow();
    const { sitemap } = getState();
    elements.nodesContainer.innerHTML = '';

    if (!activeFlow) return;

    const canShowNodeHandle = activeFlow.visualLayout.nodes.length > 1 || activeFlow.visualLayout.hubs.length > 0;

    activeFlow.visualLayout.nodes.forEach(node => {
        const step = activeFlow.steps.find(s => s.stepId === node.stepId);
        const page = sitemap.find(p => p.id === step.pageId);
        if (!step || !page) return;

        const nodeEl = document.createElement('div');
        nodeEl.id = node.nodeId;
        nodeEl.dataset.id = node.nodeId;
        nodeEl.className = 'node absolute p-4 bg-white border border-gray-300 rounded-lg shadow-sm w-48 group';
        nodeEl.style.left = `${node.x}px`;
        nodeEl.style.top = `${node.y}px`;
        
        const handleHtml = canShowNodeHandle 
            ? `<div class="node-handle" data-id="${node.nodeId}" title="Drag to connect"><i class="fas fa-plus pointer-events-none"></i></div>`
            : '';

        nodeEl.innerHTML = `
            <div class="font-bold text-gray-800 cursor-move">${page.name}</div>
            <p class="text-xs text-gray-500 mt-1 cursor-move">${step.action}</p>
            ${handleHtml}
        `;
        elements.nodesContainer.appendChild(nodeEl);
    });

    activeFlow.visualLayout.hubs.forEach(hub => {
        const hubEl = document.createElement('div');
        hubEl.id = hub.id;
        hubEl.dataset.id = hub.id;
        hubEl.className = 'hub absolute cursor-move';
        hubEl.style.left = `${hub.x}px`;
        hubEl.style.top = `${hub.y}px`;
        hubEl.innerHTML = `<div class="hub-handle" data-id="${hub.id}" title="Drag to connect"><i class="fas fa-plus pointer-events-none"></i></div>`;
        elements.nodesContainer.appendChild(hubEl);
    });
}

function renderConnections() {
    const activeFlow = getActiveFlow();
    const { selectedItemId, selectedItemType } = getState();
    elements.svgCanvas.innerHTML = ''; 
    if (!activeFlow || !activeFlow.visualLayout.connections) return;

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const arrowHead = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    arrowHead.setAttribute('id', 'arrowhead');
    arrowHead.setAttribute('markerWidth', '10');
    arrowHead.setAttribute('markerHeight', '7');
    arrowHead.setAttribute('refX', '8.5');
    arrowHead.setAttribute('refY', '3.5');
    arrowHead.setAttribute('orient', 'auto');
    arrowHead.innerHTML = `<polygon points="0 0, 10 3.5, 0 7" class="connection-arrow-head" />`;
    defs.appendChild(arrowHead);
    elements.svgCanvas.appendChild(defs);

    const allElements = [...activeFlow.visualLayout.nodes, ...activeFlow.visualLayout.hubs];

    activeFlow.visualLayout.connections.forEach(conn => {
        const fromData = allElements.find(e => (e.nodeId || e.id) === conn.from);
        const toData = allElements.find(e => (e.nodeId || e.id) === conn.to);
        if (!fromData || !toData) return;

        const fromEl = document.getElementById(conn.from);
        const toEl = document.getElementById(conn.to);
        if (!fromEl || !toEl) return;

        const fromIsHub = fromEl.classList.contains('hub');
        const toIsHub = toEl.classList.contains('hub');
        
        const start = { 
            x: fromData.x + (fromIsHub ? fromEl.offsetWidth/2 : fromEl.offsetWidth), 
            y: fromData.y + fromEl.offsetHeight / 2 
        };
        const end = { 
            x: toData.x + (toIsHub ? toEl.offsetWidth/2 : 0),
            y: toData.y + toEl.offsetHeight / 2 
        };
        const mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };

        const pathData = `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const isSelected = selectedItemId === conn.id && selectedItemType === 'connection';
        
        const interactionPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        interactionPath.setAttribute('d', pathData);
        interactionPath.setAttribute('class', 'connection-interaction-area');
        interactionPath.dataset.id = conn.id;

        const visiblePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        visiblePath.setAttribute('d', pathData);
        visiblePath.setAttribute('class', `connection-path ${isSelected ? 'selected' : ''}`);
        if(!toIsHub) visiblePath.setAttribute('marker-end', 'url(#arrowhead)');
        
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', mid.x);
        label.setAttribute('y', mid.y - 8);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('class', 'connection-label');
        label.textContent = conn.label;
        
        group.appendChild(interactionPath);
        group.appendChild(visiblePath);
        group.appendChild(label);
        elements.svgCanvas.appendChild(group);
    });
}

function renderCanvasTransform() {
    const { canvas } = getState();
    const transform = `translate(${canvas.pan.x}px, ${canvas.pan.y}px) scale(${canvas.zoom})`;
    elements.nodesContainer.style.transform = transform;
    elements.svgCanvas.style.transform = transform;
}

export function renderAll() {
    const state = getState();
    elements.projectTitle.textContent = state.projectName;
    renderPersonas();
    renderSitemap();
    renderFlowSelector();
    renderInspector();
    renderNodesAndHubs();
    renderConnections();
    renderCanvasTransform();
}

export function createModal(title, bodyHtml, footerButtons = []) {
    const modalContent = `
        <div id="app-modal-backdrop" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                <div class="p-6 border-b"><h2 class="text-xl font-bold text-gray-800">${title}</h2></div>
                <div class="p-6">${bodyHtml}</div>
                <div class="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
                    ${footerButtons.map(btn => `<button id="${btn.id}" class="${btn.class || ''} px-4 py-2 rounded-md text-sm font-medium transition-colors">${btn.text}</button>`).join('')}
                </div>
            </div>
        </div>
    `;
    elements.modalContainer.innerHTML = modalContent;
    document.getElementById('app-modal-backdrop').addEventListener('click', (e) => {
        if (e.target.id === 'app-modal-backdrop') closeModal();
    });
}

export function closeModal() {
    elements.modalContainer.innerHTML = '';
}
