# Pre-baked Phaser AE fonts

These fonts are already baked as Typography GLBs and hosted on the shared Spaces CDN.
Load a URL with `await game.typography.load(url, 'msdf')`, then reuse the font for labels
and paragraphs. The GLBs include bitmap, MTSDF and vector rendering data.
The descriptions below are practical visual guidance; inspect the
font gallery and the rendered preview sheets before choosing.

## Choose by look

Pick one display face for titles and one readable face for menus, the HUD and text; more than two families rarely
helps. Then copy that row's exact GLB URL from the catalogue below (never guess a file name), load each font once at
startup, and reuse it.

| The game looks | Titles | Menus, HUD and text |
|---|---|---|
| Casual, puzzle, kids | Baloo 2, Titan One, Grandstander | Nunito, DM Sans |
| Cartoon and comic | Bangers, Luckiest Guy, Chewy, Lilita One | Nunito |
| Ancient or epic fantasy | Cinzel, Cormorant Garamond | Libre Baskerville, Lora |
| Medieval, gothic or pirate | Uncial Antiqua, MedievalSharp, Pirata One | Lora |
| Futuristic, cyberpunk | Orbitron, Audiowide | Rajdhani |
| Pixel or terminal retro | Press Start 2P (short, at integer sizes) | VT323 |
| Military or action | Black Ops One, Anton | Rajdhani, Roboto Condensed |
| Sports and racing | Oswald, Anton | Barlow Condensed, Roboto Condensed |
| Noir, detective, notes | Special Elite, Permanent Marker | Caveat (short notes), IBM Plex Mono |
| Neutral, tools, dense HUDs | Inter | Inter, Work Sans, Roboto, Arimo |
| Numbers that must not jiggle (timers, stats) | | JetBrains Mono, IBM Plex Mono |

The engine's six UI fonts (`sans`, `serif`, `mono` and their bold faces) need no URL: `game.typography.face({ family:
'sans' })` loads one on first use. They are the defaults for widgets and labels.

## The catalogue

| Family | Style | Appearance and good game uses | Published asset |
|---|---|---|---|
| Barlow Condensed | condensed | Lighter condensed alternative to Oswald. | [GLB](https://cdn.phaser.games/gameblocks/fonts/barlow-condensed-a10157444f8614848fc2.glb) · [license](https://cdn.phaser.games/gameblocks/fonts/barlow-condensed-LICENSE-186d750eb496a4c17a76.txt) |
| Oswald | condensed | Condensed and tall. Scoreboards, sports, headlines. | [GLB](https://cdn.phaser.games/gameblocks/fonts/oswald-3fe9e527f7bdb17a4eef.glb) · [license](https://cdn.phaser.games/gameblocks/fonts/oswald-LICENSE-0fd731a904b729a4e02e.txt) |
| Roboto Condensed | condensed | Fits more text in the same width. Good for dense HUDs. | [GLB](https://cdn.phaser.games/gameblocks/fonts/roboto-condensed-419206489229fe587ac7.glb) · [license](https://cdn.phaser.games/gameblocks/fonts/roboto-condensed-LICENSE-0e4cc6ece88573545be2.txt) |
| Anton | display | Very heavy condensed. Impact-style headlines. | [GLB](https://cdn.phaser.games/gameblocks/fonts/anton-ff80abbe36a4414cc9df.glb) · [license](https://cdn.phaser.games/gameblocks/fonts/anton-LICENSE-ee67e6ee22790b7929f1.txt) |
| Baloo 2 | display | Heavy rounded display. Big friendly buttons. | [GLB](https://cdn.phaser.games/gameblocks/fonts/baloo-4f740b228adac374eb4d.glb) · [license](https://cdn.phaser.games/gameblocks/fonts/baloo-LICENSE-0ed46c05a619f53d9715.txt) |
| Bangers | display | Comic exclamations. POW. | [GLB](https://cdn.phaser.games/gameblocks/fonts/bangers-12abbe6b7d2e4156970d.glb) · [license](https://cdn.phaser.games/gameblocks/fonts/bangers-LICENSE-630dd5a307c0657b094d.txt) |
| Black Ops One | display | Heavy stencil capitals; military, tactical and action-game titles. | [GLB](https://cdn.phaser.games/gameblocks/fonts/black-ops-one-c78b54d564c1e73d14a7.glb) · [license](https://cdn.phaser.games/gameblocks/fonts/black-ops-one-LICENSE-f67ca4a200424868ee8f.txt) |
| Bungee | display | Signage face, works vertically. Bold and loud. | [GLB](https://cdn.phaser.games/gameblocks/fonts/bungee-88b968b016b43c8058a9.glb) · [license](https://cdn.phaser.games/gameblocks/fonts/bungee-LICENSE-d5787a50dde5be6c6dae.txt) |
| Chewy | display | Soft rounded comic face. | [GLB](https://cdn.phaser.games/gameblocks/fonts/chewy-198113f94970c4f8ece2.glb) · [license](https://cdn.phaser.games/gameblocks/fonts/chewy-LICENSE-cfc7749b96f63bd31c3c.txt) |
| Grandstander | display | Playful and bouncy. Kids’ games. | [GLB](https://cdn.phaser.games/gameblocks/fonts/grandstander-c379c4bbb3348a0f2341.glb) · [license](https://cdn.phaser.games/gameblocks/fonts/grandstander-LICENSE-c98642ce049ee94f1868.txt) |
| Lilita One | display | Condensed cartoon display — lots of punch per pixel. | [GLB](https://cdn.phaser.games/gameblocks/fonts/lilita-one-071e94d630c5d7451bb0.glb) · [license](https://cdn.phaser.games/gameblocks/fonts/lilita-one-LICENSE-255d5debbb80eb2ea762.txt) |
| Luckiest Guy | display | Classic comic-book poster face. | [GLB](https://cdn.phaser.games/gameblocks/fonts/luckiest-guy-b109761d538f26062b27.glb) · [license](https://cdn.phaser.games/gameblocks/fonts/luckiest-guy-LICENSE-cfc7749b96f63bd31c3c.txt) |
| Passion One | display | Bold condensed display with a soft edge. | [GLB](https://cdn.phaser.games/gameblocks/fonts/passion-one-ffd1cdc400de64af91e0.glb) · [license](https://cdn.phaser.games/gameblocks/fonts/passion-one-LICENSE-36c285c5472c625901d4.txt) |
| Righteous | display | Retro geometric display, art-deco leaning. | [GLB](https://cdn.phaser.games/gameblocks/fonts/righteous-19c12cee21f4cdb2de95.glb) · [license](https://cdn.phaser.games/gameblocks/fonts/righteous-LICENSE-1c5bc055869d5e9151ec.txt) |
| Titan One | display | Fat cartoon display. Titles and level numbers. | [GLB](https://cdn.phaser.games/gameblocks/fonts/titan-one-234e70f3b5fda95b9294.glb) · [license](https://cdn.phaser.games/gameblocks/fonts/titan-one-LICENSE-61be7c29f4835e2be724.txt) |
| Cinzel | fantasy | Carved Roman-capital serif; ancient temples, epic fantasy titles, ceremonial menus. | [GLB](https://cdn.phaser.games/gameblocks/fonts/cinzel-1cb49499a639478df899.glb) · [license](https://cdn.phaser.games/gameblocks/fonts/cinzel-LICENSE-f2b3029aba64c378bf09.txt) |
| MedievalSharp | fantasy | Jagged calligraphic medieval letters; dungeon maps, tavern signs and fantasy quest titles. | [GLB](https://cdn.phaser.games/gameblocks/fonts/medievalsharp-a86ffedb3f103e59f8be.glb) · [license](https://cdn.phaser.games/gameblocks/fonts/medievalsharp-LICENSE-45b1f44d2cb859ea4b7b.txt) |
| Pirata One | fantasy | Blackletter with dramatic sharp strokes; pirate, gothic and dark-fantasy titles. | [GLB](https://cdn.phaser.games/gameblocks/fonts/pirata-one-55795ddccc25797f592b.glb) · [license](https://cdn.phaser.games/gameblocks/fonts/pirata-one-LICENSE-e8ad3f3de5baeff6bac6.txt) |
| Uncial Antiqua | fantasy | Rounded medieval manuscript capitals; spell books, Celtic or high-fantasy headings. | [GLB](https://cdn.phaser.games/gameblocks/fonts/uncial-antiqua-da1948283c8975c51cc9.glb) · [license](https://cdn.phaser.games/gameblocks/fonts/uncial-antiqua-LICENSE-244ca4ef7b106d8c660e.txt) |
| Caveat | handwriting | Loose handwritten cursive; notes, postcards and friendly story prompts, not dense HUD numbers. | [GLB](https://cdn.phaser.games/gameblocks/fonts/caveat-0019c8e3335157c087fc.glb) · [license](https://cdn.phaser.games/gameblocks/fonts/caveat-LICENSE-1f9d81d094273d82f389.txt) |
| Permanent Marker | handwriting | Broad felt-marker handwriting; street-art titles, sports badges and playful annotations. | [GLB](https://cdn.phaser.games/gameblocks/fonts/permanent-marker-ce0679e392b586220833.glb) · [license](https://cdn.phaser.games/gameblocks/fonts/permanent-marker-LICENSE-cfc7749b96f63bd31c3c.txt) |
| IBM Plex Mono | mono | The other monospace — narrower than JetBrains. | [GLB](https://cdn.phaser.games/gameblocks/fonts/ibm-plex-mono-67db464e7bebe94c88fa.glb) · [license](https://cdn.phaser.games/gameblocks/fonts/ibm-plex-mono-LICENSE-7e6b2818edbd8f6a01ae.txt) |
| JetBrains Mono | mono | Monospace for stats, seeds, timers and debug HUDs. | [GLB](https://cdn.phaser.games/gameblocks/fonts/jetbrains-mono-fd9b6ef105a4c9cf43a6.glb) · [license](https://cdn.phaser.games/gameblocks/fonts/jetbrains-mono-LICENSE-b2fe5e8987594e9ffd1d.txt) |
| Press Start 2P | retro | Strict blocky 8-bit arcade pixels; retro score screens and short labels, use at integer sizes. | [GLB](https://cdn.phaser.games/gameblocks/fonts/press-start-2p-fe67f963687529d5b8a1.glb) · [license](https://cdn.phaser.games/gameblocks/fonts/press-start-2p-LICENSE-705960c3281a5765ecc0.txt) |
| Special Elite | retro | Worn typewriter serif; detective files, noir clues and historical documents. | [GLB](https://cdn.phaser.games/gameblocks/fonts/special-elite-0260b793f2fb08f7703b.glb) · [license](https://cdn.phaser.games/gameblocks/fonts/special-elite-LICENSE-cfc7749b96f63bd31c3c.txt) |
| VT323 | retro | Tall low-resolution terminal mono; computer terminals, hacking screens and retro dialogue. | [GLB](https://cdn.phaser.games/gameblocks/fonts/vt323-2fc6a497655f31ba98aa.glb) · [license](https://cdn.phaser.games/gameblocks/fonts/vt323-LICENSE-27d9af34210253e7ca12.txt) |
| Audiowide | sci-fi | Rounded wide techno display; arcade sci-fi logos and racing titles. | [GLB](https://cdn.phaser.games/gameblocks/fonts/audiowide-1cae8a9f948c97f3032c.glb) · [license](https://cdn.phaser.games/gameblocks/fonts/audiowide-LICENSE-4fe01b13ffb41faa8f03.txt) |
| Orbitron | sci-fi | Wide squared geometric sans; spaceship dashboards, futuristic titles and sci-fi HUDs. | [GLB](https://cdn.phaser.games/gameblocks/fonts/orbitron-014e68da75c2b3b032bd.glb) · [license](https://cdn.phaser.games/gameblocks/fonts/orbitron-LICENSE-ab609b0e110d622435ff.txt) |
| Rajdhani | sci-fi | Narrow square-corner sans; readable tech controls, cyberpunk menus and telemetry. | [GLB](https://cdn.phaser.games/gameblocks/fonts/rajdhani-e02766be2f5f5becf78d.glb) · [license](https://cdn.phaser.games/gameblocks/fonts/rajdhani-LICENSE-f62ef357d3a1c3d27edd.txt) |
| Cormorant Garamond | serif | High-contrast literary serif with fine hairlines; elegant fantasy titles and royal invitations, best at large sizes. | [GLB](https://cdn.phaser.games/gameblocks/fonts/cormorant-garamond-dfd9103ff1457b66d9de.glb) · [license](https://cdn.phaser.games/gameblocks/fonts/cormorant-garamond-LICENSE-60700d351cac4650c51f.txt) |
| Libre Baskerville | serif | Traditional book serif with sturdy strokes; fantasy lore, readable journals and historical strategy UI. | [GLB](https://cdn.phaser.games/gameblocks/fonts/libre-baskerville-60ee9d41562dcbab09c1.glb) · [license](https://cdn.phaser.games/gameblocks/fonts/libre-baskerville-LICENSE-3624eddd4c8f8a908130.txt) |
| Lora | serif | Serif with contrast — story text, letters, lore. | [GLB](https://cdn.phaser.games/gameblocks/fonts/lora-845bdcb0d939277009a3.glb) · [license](https://cdn.phaser.games/gameblocks/fonts/lora-LICENSE-1d9a970809ac804b582a.txt) |
| Arimo | ui | Metric-compatible with Arial, so it drops into Arial layouts exactly. | [GLB](https://cdn.phaser.games/gameblocks/fonts/arimo-3957f8d751ad7b667ca6.glb) · [license](https://cdn.phaser.games/gameblocks/fonts/arimo-LICENSE-11cce536cd2f3864d767.txt) |
| DM Sans | ui | Geometric and friendly. Good for casual menus. | [GLB](https://cdn.phaser.games/gameblocks/fonts/dm-sans-b400c15bf1adf7bdd6a2.glb) · [license](https://cdn.phaser.games/gameblocks/fonts/dm-sans-LICENSE-9af36190332437f5ecd0.txt) |
| Inter | ui | The UI default — designed for screens, tight and neutral. | [GLB](https://cdn.phaser.games/gameblocks/fonts/inter-c1ea02776f2be5e764db.glb) · [license](https://cdn.phaser.games/gameblocks/fonts/inter-LICENSE-5b9321a4298cfeb6b343.txt) |
| Nunito | ui | Rounded terminals. The friendliest of the UI set. | [GLB](https://cdn.phaser.games/gameblocks/fonts/nunito-607707f07d6a21bd7a0c.glb) · [license](https://cdn.phaser.games/gameblocks/fonts/nunito-LICENSE-580df76c95a1ec5ab878.txt) |
| Roboto | ui | Android’s workhorse. Neutral, slightly narrow. | [GLB](https://cdn.phaser.games/gameblocks/fonts/roboto-cbac6c386ee2184b2c5e.glb) · [license](https://cdn.phaser.games/gameblocks/fonts/roboto-LICENSE-061402327a96aadb0bfb.txt) |
| Work Sans | ui | Optimised for on-screen text at mid sizes. | [GLB](https://cdn.phaser.games/gameblocks/fonts/work-sans-5bd54be85cb776b6754a.glb) · [license](https://cdn.phaser.games/gameblocks/fonts/work-sans-LICENSE-749aca05078664ce682d.txt) |

These assets contain a Latin, Greek, Cyrillic and punctuation subset. A source font
may support more characters than its baked GLB. For scripts outside this range,
bake and publish a suitable licensed font under the game's own CDN path.
Keep the linked license with every font. Do not inline GLBs or source fonts in game.js.
