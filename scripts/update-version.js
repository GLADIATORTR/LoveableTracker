#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read current version
const versionPath = path.join(__dirname, '../version.json');
const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));

// Generate new version number
function incrementVersion(currentVersion) {
  // Extract the numeric part (e.g., "AA103" -> 103)
  const match = currentVersion.match(/^([A-Z]+)(\d+)$/);
  if (!match) {
    throw new Error(`Invalid version format: ${currentVersion}`);
  }
  
  const prefix = match[1];
  const number = parseInt(match[2]);
  const newNumber = number + 1;
  
  return `${prefix}${newNumber}`;
}

// Update version
const newVersion = incrementVersion(versionData.version);
const description = process.argv[2] || 'Code updates and improvements';

versionData.version = newVersion;
versionData.lastUpdated = new Date().toISOString();
versionData.changes.unshift({
  version: newVersion,
  date: new Date().toISOString().split('T')[0],
  description: description
});

// Keep only last 10 changes
versionData.changes = versionData.changes.slice(0, 10);

// Write updated version
fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2));

// Update TopBar.tsx with new version
const topBarPath = path.join(__dirname, '../client/src/components/layout/TopBar.tsx');
let topBarContent = fs.readFileSync(topBarPath, 'utf8');

// Replace version in TopBar.tsx
topBarContent = topBarContent.replace(
  /Version\s+[A-Z]+\d+/g,
  `Version ${newVersion}`
);

fs.writeFileSync(topBarPath, topBarContent);

// Update replit.md with new version
const replitMdPath = path.join(__dirname, '../replit.md');
let replitMdContent = fs.readFileSync(replitMdPath, 'utf8');

// Update title line
replitMdContent = replitMdContent.replace(
  /# Real Estate Financials - Version [A-Z]+\d+/,
  `# Real Estate Financials - Version ${newVersion}`
);

// Update recent changes section
const changesSection = `## Recent Changes (Version ${newVersion})
- ${description}`;

replitMdContent = replitMdContent.replace(
  /## Recent Changes \(Version [A-Z]+\d+\)[^#]*/,
  changesSection + '\n\n'
);

fs.writeFileSync(replitMdPath, replitMdContent);

console.log(`Version updated to ${newVersion}`);
console.log(`Description: ${description}`);