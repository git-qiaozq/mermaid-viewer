# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mermaid Viewer is a lightweight, offline-first local web application for viewing and rendering:
- Mermaid diagrams (flowcharts, sequence diagrams, class diagrams, etc.)
- Markdown documents with GitHub Flavored Markdown support
- JSON data with tree visualization

The app runs entirely offline using a Python standard library HTTP server with a plain HTML/CSS/JavaScript frontend. No build tools, npm, or external dependencies required.

## Running the Application

Start the server:
```bash
python server.py
# or
python3 server.py
```

The server runs on `http://localhost:8080` and automatically opens in your default browser.

Stop the server:
- Click the "退出" (Exit) button in the UI (recommended)
- Press `Ctrl+C` in the terminal

Alternative launchers:
- `start.pyw` - Windows background launcher (no console window)
- `run.command` - macOS background launcher
- `MermaidViewer.app` - macOS app bundle

## Architecture

### Backend (server.py)
- Pure Python 3 standard library HTTP server
- Serves static files from `static/` directory
- Serves example files from `examples/` directory
- Provides `/api/shutdown` endpoint (localhost-only for security)
- Uses `ThreadedTCPServer` for concurrent request handling
- Port configured via `PORT = 8080` constant

### Frontend (static/)
Single-page application with no build step:

**Main files:**
- `static/index.html` - Page structure and UI layout
- `static/js/app.js` - All application logic (monolithic IIFE module)
- `static/css/style.css` - Styling with CSS variables for theming

**Vendored libraries:**
- `mermaid.min.js` (v10.x) - Diagram rendering
- `marked.min.js` - Markdown parsing
- `highlight.min.js` (v11.9.0) - Code syntax highlighting

### Key Frontend Architecture (app.js)

The frontend is organized as a single IIFE with these subsystems:

1. **Content type detection** - `detectContentType()` auto-detects Mermaid/Markdown/JSON
2. **Rendering pipeline** - `renderContent()` dispatches to specialized renderers
3. **Mermaid rendering** - `renderMermaid()` validates and renders diagrams
4. **Markdown rendering** - `renderMarkdown()` supports embedded Mermaid code blocks
5. **JSON rendering** - `renderJSON()` with tree view, lazy loading, and scroll sync
6. **Persistence** - localStorage for history (30 items), favorites (15 items), theme
7. **Export** - SVG/PNG for Mermaid, .md/.html for Markdown, .json for JSON
8. **File System Access API** - Folder browsing (Chrome/Edge only)

### Configuration

**Backend config (server.py):**
```python
PORT = 8080
HOST = "localhost"
```

**Frontend config (app.js):**
```javascript
const CONFIG = {
    MAX_HISTORY: 30,
    MAX_FAVORITES: 15,
    DEBOUNCE_DELAY: 500,
    ZOOM_STEP: 0.1,
    ZOOM_MIN: 0.25,
    ZOOM_MAX: 3
};
```

**Theme config (style.css):**
CSS variables under `:root` and `[data-theme="light"]` for dark/light themes.

## Important Implementation Details

### Content Type Detection Order
1. User's explicit mode selection (auto/mermaid/markdown)
2. JSON parsing attempt
3. Mermaid diagram pattern matching
4. Markdown heuristic scoring
5. Default to Mermaid

### Markdown + Mermaid Integration
Markdown rendering post-processes fenced code blocks with `language-mermaid` class and renders them as diagrams inline. This means Mermaid diagrams can be embedded in Markdown documents.

### JSON Features
- Smart extraction from partial/embedded JSON
- Tree view with expand/collapse
- Lazy loading for large objects/arrays (>100 items)
- Scroll synchronization between editor and preview
- Auto-formatting for small files (<10KB)

### Security Considerations
- `/api/shutdown` only accepts requests from localhost (127.0.0.1, ::1)
- Example file serving validates paths to prevent directory traversal
- File System Access API requires user permission per browser security model

### Browser Compatibility
- Folder browsing requires Chrome 86+ or Edge 86+ (File System Access API)
- Export with custom filename requires File System Access API
- Falls back to traditional blob download for unsupported browsers

## Development Guidelines

### Modifying the Frontend
- All UI logic is in `static/js/app.js` (no build step needed)
- Edit CSS variables in `static/css/style.css` for theme changes
- Refresh browser to see changes (no hot reload)

### Adding Example Files
Place files in `examples/` directory with extensions:
- `.mmd` for Mermaid diagrams
- `.md` for Markdown documents
- `.json` for JSON data

### Modifying the Server
- Keep Python 3 standard library only (no external dependencies)
- Maintain offline-first design
- Test shutdown endpoint security when adding new endpoints

### Testing
No automated tests currently exist. Manual testing workflow:
1. Start server with `python server.py`
2. Test in browser at `http://localhost:8080`
3. Verify rendering for Mermaid/Markdown/JSON
4. Test export functionality
5. Test history/favorites persistence
6. Test folder browsing (Chrome/Edge)
7. Test shutdown button

## Known Limitations

- No automated tests
- README mentions 20 history items but code uses 30 (CONFIG.MAX_HISTORY)
- Folder browsing only works in Chromium-based browsers
- JSON file upload not supported via file picker (only drag-drop or folder browse)
- Large file handling optimized but not benchmarked
