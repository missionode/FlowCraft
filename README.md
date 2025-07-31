# FlowCraft

# FlowCraft: Multi-Purpose Workflow Planner

[![FlowCraft Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://example.com/demo) <!-- Placeholder; replace with actual if available -->

FlowCraft is a web-based visual tool inspired by n8n, designed for planning tasks, user flows, and sitemaps. It allows users to create node-based workflows with branches, conditions, loops, and integrations to sitemaps for UX/app design. Built as a single-page application using vanilla HTML, CSS, and JavaScript.

## Features

- **Node-Based Workflow Builder**: Add unified nodes (standard, decision, merge) with properties like name, description, and color.
- **Flows and Connections**: Draw arrows between nodes; split for conditions (with manual styling: color, dash); merge branches; create loops by connecting back.
- **Sitemap Integration**: Attach nodes to hierarchical sitemaps (e.g., nav sections like bottom navigation, app drawer); separate collapsible panel for viewing.
- **UI Elements**: Thin top toolbar for actions (add node, draw arrow, undo/redo, zoom, save/export/import); inline renaming; drag-and-drop canvas.
- **Persistence**: Auto-save to IndexedDB; export/import as JSON for backups.
- **Animations and Interactivity**: Subtle CSS transitions for smooth UX (e.g., node placement bounce, panel slide).
- **Responsive Design**: Works on desktop and mobile browsers.

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/flowcraft.git
   ```
2. Open `index.html` in any modern web browser (e.g., Chrome, Firefox).
   - No server required; runs fully client-side.

Alternatively, host it on a static server like GitHub Pages or Vercel for online access.

## Usage

1. **Getting Started**:
   - Open the app: Canvas loads as "Untitled".
   - Use the toolbar to add nodes, draw arrows, and manage actions.

2. **Building a Workflow**:
   - Click "Add Node" and place on canvas.
   - Double-click node to edit properties (name, desc, color, type).
   - Draw arrows to connect; drag split icon (appears after connection) for branches; add condition text and style.
   - For loops: Connect arrow back to a node.
   - Merge: Use a "Merge" type node.

3. **Sitemap Attachment**:
   - Click sitemap icon on a node.
   - Create new (name prompt) or select existing + nav checkboxes.
   - View in right panel; collapse for more canvas space.

4. **Saving and Sharing**:
   - Auto-saves to browser's IndexedDB.
   - Export JSON for backups; import to restore.
   - Rename canvas by clicking the title.

5. **Shortcuts**:
   - Undo/Redo: Toolbar icons (or Ctrl+Z/Y).
   - Zoom: Icons or mouse wheel.

## Tech Stack

- **HTML5**: Structure and canvas elements.
- **CSS3**: Styling, transitions, and responsive design (e.g., flexbox, media queries).
- **Vanilla JavaScript**: Logic, drag-drop (DOM events), SVG arrows, IndexedDB storage.
- **Icons**: Font Awesome 6 (via CDN).
- **No Frameworks**: Keeps it lightweight (~10KB minified).

## Limitations

- No real-time collaboration or server-side features.
- Conditions are free-text only; no execution/simulation.
- Browser storage: Data persists per device/browser; clear cache to reset.
- Splitting/conditions simplified in code; expand for full branching UI.

## Contributing

Contributions welcome! Fork the repo, make changes, and submit a PR.

1. Report issues via GitHub Issues.
2. For major changes, discuss first.

## License

MIT License. See [LICENSE](LICENSE) for details.

## Acknowledgments

- Inspired by n8n.io for workflow visualization.
- Built with insights from open-source tools like jsPlumb (though not used here for vanilla purity).

For questions, contact [nath.syam.1986@gmail.com].
