SAR Portfolio - Single-page site (separate files)
-----------------------------------------------
Structure:
- index.html         -> main page
- css/styles.css     -> styling
- js/app.js          -> theme, nav, UI behavior
- js/three-scene.js  -> minimal Three.js scene (keeps it simple)
- assets/            -> put images or resume.pdf here (resume.pdf expected at repo root if used)

How to use:
- Edit `index.html` content (your email, github link, project summaries).
- Replace or add `resume.pdf` in the project root if you want the resume download to work.
- To run locally: open index.html in a browser (no server required).
- To deploy: push the folder to a GitHub repo and enable GitHub Pages (root branch). The site will be available at your GitHub Pages URL.

Notes:
- The Three.js scene is intentionally simple for performance and ease-of-editing.
- If mobile performance is poor, reduce particles (variable `count` in js/three-scene.js) or change icosahedron detail from 2 to 1.
