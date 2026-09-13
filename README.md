# GANAPATI — The Beginning of Everything

A static, real-time Three.js cinematic experience for Nexis Solutions. GSAP ScrollTrigger drives one continuous scroll timeline and authored camera travel through twelve 3D sets. The Web Audio score is synthesized locally and starts only when enabled.

Run locally with `python -m http.server 5173 --bind 127.0.0.1 --directory dist`, then open http://127.0.0.1:5173. Run `node check.mjs` for the small verification check. No package installation or build step is needed.

The main experience uses a real 3D sculpture, architecture, mountains, trishul, forest, modak, particles, and shader water. Original generated images are used only by the reduced-motion or unavailable-WebGL edition. Phone framing and particle counts adapt below 700 pixels. Film mode runs for approximately six and a half minutes and pauses on manual input or when the tab is hidden.

## Credits

The Ganesha mesh is a CC0 public-domain scan of a 10th–11th century Javanese sculpture, from the Minneapolis Institute of Art, distributed through Wikimedia Commons:
https://commons.wikimedia.org/wiki/File:Ganesha,_10th_-_11th_C_CE_-_3D_model_by_Minneapolis_Institute_of_Art_-_Sketchfab.stl

Rendered with a new gold material; centered, scaled, and vertex normals smoothed. The museum has not endorsed this experience. Temple and symbolic objects are original procedural geometry. Nexis logo supplied by the user. Fallback artwork generated for this project.

Three.js 0.180.0 and addons: MIT license, https://github.com/mrdoob/three.js/blob/r180/LICENSE
GSAP 3.13.0 and ScrollTrigger: https://gsap.com/standard-license/
Google Fonts: Cormorant Garamond and Manrope, served from Google Fonts under their open font licenses.

Reference architecture studied locally: `references/saeed-kolivand-portfolio` (persistent canvas, shot poses, normalized scroll, mobile quality) and `references/scrollr3fproject` (depth, object choreography, pointer parallax). Their artwork and source are not included in the delivered site.
