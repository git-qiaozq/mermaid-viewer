# Repository Guidelines

## Project Structure & Module Organization
`server.py` runs the local HTTP server and serves `static/` plus example files from `examples/`. `start.pyw` is the no-console launcher, and `run.command` is the macOS helper for background startup. Frontend code lives in `static/index.html`, `static/js/app.js`, and `static/css/style.css`. Keep sample Mermaid/Markdown files in `examples/`. Treat `static/js/*.min.js` and `static/css/*min.css` as vendored third-party assets: do not hand-edit them unless you are intentionally upgrading a bundled library. `MermaidViewer.app/` contains the macOS app wrapper and icons.

## Build, Test, and Development Commands
There is no build pipeline or package manager in this repo.

- `python3 server.py`: start the local server at `http://localhost:8080` with console logs.
- `python3 start.pyw`: launch the same app without a visible console window.
- `./run.command`: macOS convenience entrypoint for silent background startup.

After changes, verify the app manually in a browser by loading Mermaid, Markdown, and JSON content, opening a file from `examples/`, and testing export or history behavior if your change touches those areas.

## Coding Style & Naming Conventions
Follow the existing style in place: 4-space indentation for Python, JavaScript, and CSS blocks. Use `snake_case` for Python functions and variables, `camelCase` for JavaScript functions and state fields, and lowercase kebab-case for CSS classes and example file names such as `class-diagram.mmd`. Prefer small targeted edits in `app.js`; keep shared constants grouped in `CONFIG` and avoid mixing new feature state into unrelated sections. Preserve the current bilingual comments only when they add context.

## Testing Guidelines
This repository does not currently include automated tests. Use manual smoke tests before opening a PR:

- Start the server and confirm `index.html` loads.
- Render at least one Mermaid diagram, one Markdown document, and one JSON payload.
- Re-test file upload, folder browsing, and export flows when modifying related UI logic.

## Commit & Pull Request Guidelines
Recent commits use short imperative messages in Chinese, for example `新增Mac上可以直接运行的app` or `更新app.js中的配置...`. Keep commit subjects concise and action-focused. PRs should include a brief summary, affected files or behaviors, manual verification steps, and screenshots or GIFs for UI changes. Link the related issue when one exists.
