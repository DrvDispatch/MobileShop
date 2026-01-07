/**
 * Local ESLint Plugin: skin-boundaries
 * 
 * Custom rules to enforce skin architecture purity.
 */

const noHooksInSkins = require('./no-hooks-in-skins');

module.exports = {
    meta: {
        name: 'eslint-plugin-skin-boundaries',
        version: '1.0.0',
    },
    rules: {
        'no-hooks-in-skins': noHooksInSkins,
    },
};
