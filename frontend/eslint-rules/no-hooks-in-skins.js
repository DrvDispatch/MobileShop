/**
 * ESLint Rule: no-hooks-in-skins
 * 
 * Enforces skin purity by preventing:
 * - Importing hooks from core (useTenant, useFeatures, etc.)
 * - Importing from @/contexts
 * - Importing from @/store
 * - Using fetch() directly
 * - Accessing localStorage
 * 
 * Skins should receive all data via props (View Models).
 */

const FORBIDDEN_IMPORTS = [
    // Core hooks (except types)
    { pattern: /^@core\/hooks(?!.*\/types)/, message: 'Skins cannot import hooks from @core/hooks. Use VM props instead.' },
    { pattern: /^@\/core\/hooks(?!.*\/types)/, message: 'Skins cannot import hooks from @/core/hooks. Use VM props instead.' },

    // Context providers
    { pattern: /^@\/contexts/, message: 'Skins cannot import from @/contexts. Use VM props instead.' },
    { pattern: /^@\/lib\/TenantProvider/, message: 'Skins cannot import TenantProvider. Use VM props instead.' },

    // Stores
    { pattern: /^@\/store/, message: 'Skins cannot import from @/store. Use VM props instead.' },

    // Direct API clients
    { pattern: /^@\/lib\/api$/, message: 'Skins cannot import API client. Use VM props instead.' },
];

const FORBIDDEN_HOOK_CALLS = [
    'useTenant',
    'useTenantOptional',
    'useFeatures',
    'useCartStore',
    'useUIConfig',
    'useBookingFlow',
    'useCheckout',
    'useChatWidget',
];

const FORBIDDEN_GLOBALS = [
    'fetch',
    'localStorage',
    'sessionStorage',
];

module.exports = {
    meta: {
        type: 'problem',
        docs: {
            description: 'Enforce skin purity by preventing direct hook/store/API usage',
            category: 'Best Practices',
            recommended: true,
        },
        messages: {
            forbiddenImport: '{{message}}',
            forbiddenHook: 'Skins cannot call {{name}}(). Data should come via VM props.',
            forbiddenGlobal: 'Skins cannot use {{name}} directly. Use VM props instead.',
        },
        schema: [],
    },

    create(context) {
        const filename = context.getFilename();

        // Only apply to files in skins directory
        if (!filename.includes('/skins/') && !filename.includes('\\skins\\')) {
            return {};
        }

        // Skip type-only imports (import type { X })
        function isTypeOnlyImport(node) {
            return node.importKind === 'type' ||
                (node.specifiers && node.specifiers.every(s => s.importKind === 'type'));
        }

        return {
            // Check imports
            ImportDeclaration(node) {
                if (isTypeOnlyImport(node)) {
                    return; // Allow type-only imports
                }

                const source = node.source.value;

                for (const forbidden of FORBIDDEN_IMPORTS) {
                    if (forbidden.pattern.test(source)) {
                        context.report({
                            node,
                            messageId: 'forbiddenImport',
                            data: { message: forbidden.message },
                        });
                        break;
                    }
                }
            },

            // Check hook calls
            CallExpression(node) {
                if (node.callee.type === 'Identifier') {
                    const name = node.callee.name;

                    // Check forbidden hooks
                    if (FORBIDDEN_HOOK_CALLS.includes(name)) {
                        context.report({
                            node,
                            messageId: 'forbiddenHook',
                            data: { name },
                        });
                    }

                    // Check forbidden globals
                    if (FORBIDDEN_GLOBALS.includes(name)) {
                        context.report({
                            node,
                            messageId: 'forbiddenGlobal',
                            data: { name },
                        });
                    }
                }

                // Check member expression calls like localStorage.getItem
                if (node.callee.type === 'MemberExpression' &&
                    node.callee.object.type === 'Identifier') {
                    const objectName = node.callee.object.name;

                    if (objectName === 'localStorage' || objectName === 'sessionStorage') {
                        context.report({
                            node,
                            messageId: 'forbiddenGlobal',
                            data: { name: objectName },
                        });
                    }
                }
            },

            // Check direct fetch() usage
            MemberExpression(node) {
                if (node.object.type === 'Identifier') {
                    const name = node.object.name;
                    if (name === 'localStorage' || name === 'sessionStorage') {
                        // Already caught by CallExpression for method calls
                        // This catches property access
                        context.report({
                            node,
                            messageId: 'forbiddenGlobal',
                            data: { name },
                        });
                    }
                }
            },
        };
    },
};
