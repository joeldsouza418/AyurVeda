import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.join(__dirname, 'src');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const colorReplacements = [
  // Backgrounds: Replace mostly greens/blues with brand-primary or brand-secondary
  { regex: /bg-green-([5-9]00)/g, replacement: 'bg-brand-primary' },
  { regex: /bg-blue-([5-9]00)/g, replacement: 'bg-brand-primary' },
  { regex: /bg-indigo-([5-9]00)/g, replacement: 'bg-brand-primary' },
  { regex: /bg-emerald-([5-9]00)/g, replacement: 'bg-brand-primary' },
  { regex: /bg-teal-([5-9]00)/g, replacement: 'bg-brand-secondary' },

  // Light backgrounds (e.g. green-50, gray-50) replace with brand-light or transparent
  { regex: /bg-green-[5-1]00/g, replacement: 'bg-brand-light/50' },
  { regex: /bg-gray-50/g, replacement: 'bg-brand-light' },
  { regex: /bg-white/g, replacement: 'bg-brand-light/80 backdrop-blur-sm' },

  // Text: Dark colors replace with brand-dark, light colors keep or use brand-light
  { regex: /text-gray-900/g, replacement: 'text-brand-dark' },
  { regex: /text-gray-800/g, replacement: 'text-brand-dark' },
  { regex: /text-green-[6-9]00/g, replacement: 'text-brand-primary' },
  { regex: /text-blue-[6-9]00/g, replacement: 'text-brand-primary' },
  
  // Borders
  { regex: /border-green-[5-9]00/g, replacement: 'border-brand-primary' },
  { regex: /border-gray-200/g, replacement: 'border-brand-accent/30' },
  { regex: /border-gray-300/g, replacement: 'border-brand-accent/50' },
  
  // Ring colors
  { regex: /ring-green-[5-9]00/g, replacement: 'ring-brand-primary' },
  { regex: /ring-indigo-[5-9]00/g, replacement: 'ring-brand-primary' },
  { regex: /focus:ring-green-[5-9]00/g, replacement: 'focus:ring-brand-primary' },
  { regex: /focus:ring-indigo-[5-9]00/g, replacement: 'focus:ring-brand-primary' }
];

const glassyButtonClass = 'bg-brand-primary/80 backdrop-blur-md border border-white/30 shadow-lg text-white hover:bg-brand-primary/90 transition-all duration-300 rounded-xl';

walkDir(srcDir, function(filePath) {
  if (filePath.endsWith('.jsx')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;

    // Apply color replacements
    colorReplacements.forEach(({regex, replacement}) => {
      content = content.replace(regex, replacement);
    });

    // Replace typical button styles with glassmorphism
    // Look for <button className="..."> or any className containing padding and rounded like px-4 py-2 rounded-md bg-... text-white
    // Simply finding "bg-brand-primary text-white" combined with typical button padding and making it glassy
    content = content.replace(/bg-brand-primary\s+([^"']*)text-white([^"']*)/g, (match, p1, p2) => {
       // if it already has backdrop-blur, maybe skip
       if (match.includes('backdrop-blur')) return match;
       return `${glassyButtonClass} ${p1}${p2}`.replace(/\s+/g, ' ').trim();
    });

    // some places might specifically have "rounded-md shadow-sm" which we can upgrade
    content = content.replace(/rounded-md\s+shadow-sm/g, 'rounded-xl shadow-md');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log('Updated:', filePath);
    }
  }
});
