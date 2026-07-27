import fs from 'node:fs';

const file = 'src/index.css';
let source = fs.readFileSync(file, 'utf8');

function removeExact(fragment, label) {
  const first = source.indexOf(fragment);
  const last = source.lastIndexOf(fragment);
  if (first < 0) throw new Error(`Missing legacy fragment: ${label}`);
  if (first !== last) throw new Error(`Legacy fragment is not unique: ${label}`);
  source = source.slice(0, first) + source.slice(first + fragment.length);
}

removeExact(
  '  transition: border-color 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.55s cubic-bezier(0.16, 1, 0.3, 1), transform 0.55s cubic-bezier(0.16, 1, 0.3, 1), background 0.5s ease;\n',
  'legacy luxury-card transition ownership',
);
removeExact('  left: -150%;\n', 'layout-driven sheen start');
removeExact('  transform: skewX(-18deg);\n', 'legacy sheen transform');
removeExact('  transition: all 0.85s ease-out;\n', 'legacy sheen transition-all');
removeExact('  transform: translateY(-5px) scale(1.005);\n', 'legacy card hover transform');
removeExact(
  '.luxury-card:hover::before { left: 150%; transition: all 0.85s cubic-bezier(0.16, 1, 0.3, 1); }\n',
  'legacy layout-driven sheen hover rule',
);
removeExact(
  '.tilt-card-wrapper { perspective: 1100px; transform-style: preserve-3d; }\n'
  + '.tilt-card-inner { transform: rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg)); transition: transform 0.08s linear; will-change: transform; transform-style: preserve-3d; }\n'
  + '.tilt-card-inner > * { transform: translateZ(28px); }\n\n',
  'legacy TiltCard implementation',
);
removeExact('  .luxury-card { transition: none !important; }\n', 'legacy reduced-motion card ownership');
removeExact('  .tilt-card-inner { transform: none !important; }\n', 'legacy reduced-motion tilt ownership');

fs.writeFileSync(file, source);
console.log('Removed legacy hover/tilt motion rules from src/index.css');
