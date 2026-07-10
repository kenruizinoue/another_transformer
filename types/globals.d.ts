/// <reference types="jest" />

// Allow side-effect and module imports of CSS (global.css, *.module.css) which
// Metro/Expo handle at bundle time but TypeScript otherwise cannot resolve.
declare module '*.css';
