#!/usr/bin/env node
/**
 * Architecture boundary check: native and platform modules may only be imported
 * under the adapter layers. Screens, hooks, components, and domain must depend
 * on gateways instead. Fails CI when a violation appears.
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');

// Modules that must stay behind the adapter layers.
const NATIVE_MODULES = [
  'expo-audio',
  'expo-file-system',
  'expo-speech-recognition',
  'whisper.rn',
  'expo-clipboard',
  'expo-print',
  'expo-sharing',
  '@react-native-async-storage/async-storage',
];

// Directories allowed to import them (relative to src/).
const ALLOWED_DIRS = ['lib/adapters', 'lib/audio', 'lib/transcription'];

const SKIP_SEGMENTS = ['__tests__', '__mocks__', 'test-utils'];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_SEGMENTS.includes(entry.name)) walk(full, files);
    } else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\./.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

const violations = [];
for (const file of walk(SRC)) {
  const rel = path.relative(SRC, file).split(path.sep).join('/');
  if (ALLOWED_DIRS.some((dir) => rel.startsWith(`${dir}/`))) continue;
  const content = fs.readFileSync(file, 'utf8');
  for (const mod of NATIVE_MODULES) {
    const pattern = new RegExp(`from ['"]${mod.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
    if (pattern.test(content)) {
      violations.push(`${rel} imports ${mod}`);
    }
  }
}

if (violations.length > 0) {
  console.error('Native-module boundary violations:');
  for (const violation of violations) console.error(`  ${violation}`);
  process.exit(1);
}
console.log('Boundaries clean: native modules only under', ALLOWED_DIRS.join(', '));
