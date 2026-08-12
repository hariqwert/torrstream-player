const fs = require('fs');
let code = fs.readFileSync('play.php', 'utf8');

code = code.replace(/const rotateBtn = document\.createElement\('button'\);\s*rotateBtn\.className = 'flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-black\/60 hover:bg-zinc-800 text-white rounded-full transition-all duration-300 shadow-lg shadow-black\/40 border border-white\/10 backdrop-blur-md';\s*rotateBtn\.innerHTML = '<i data-lucide="rotate-cw" class="w-5 h-5"><\/i>';/g, 
`const rotateBtn = document.createElement('button');
rotateBtn.className = 'flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-black/60 hover:bg-zinc-800 text-white rounded-full transition-all duration-300 shadow-lg shadow-black/40 border border-white/10 backdrop-blur-md pointer-events-auto';
rotateBtn.innerHTML = '<i data-lucide="rotate-cw" class="w-5 h-5"></i>';
rotateBtn.onclick = () => window.toggleRotation();
topControls.appendChild(rotateBtn);

const container = document.getElementById('player-container') || document.body;
container.appendChild(topControls);
if (window.lucide) window.lucide.createIcons();
`);
fs.writeFileSync('play.php', code);
