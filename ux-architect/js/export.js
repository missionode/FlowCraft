// Handles the logic for exporting the application state to JSON.
import { getState } from './state.js';

function formatStateForExport() {
    const state = getState();
    
    // Create a deep copy to avoid modifying the original state
    const exportState = JSON.parse(JSON.stringify(state));

    const formatted = {
        projectInfo: {
            projectName: exportState.projectName,
            projectDescription: exportState.projectDescription,
            exportDate: new Date().toISOString(),
            version: "1.0"
        },
        personas: exportState.personas,
        sitemap: exportState.sitemap,
        userFlows: exportState.userFlows
    };
    
    return formatted;
}


export function exportStateAsJson() {
    const exportData = formatStateForExport();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    
    const fileName = `${exportData.projectInfo.projectName.replace(/\s+/g, '_') || 'Untitled_Project'}.json`;
    downloadAnchorNode.setAttribute("download", fileName);
    
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}
