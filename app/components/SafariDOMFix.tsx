'use client';

import { useEffect } from 'react';

export default function SafariDOMFix() {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Polyfill Node.prototype.removeChild to prevent Safari / Translate / Extension DOM crashes
        const originalRemoveChild = Node.prototype.removeChild;
        Node.prototype.removeChild = function <T extends Node>(child: T): T {
            if (child.parentNode !== this) {
                if (process.env.NODE_ENV !== 'production') {
                    console.warn('Node.removeChild: The node to be removed is not a child of this node.', child);
                }
                return child;
            }
            return originalRemoveChild.call(this, child) as T;
        };

        // Polyfill Node.prototype.insertBefore to prevent Safari / Translate / Extension DOM crashes
        const originalInsertBefore = Node.prototype.insertBefore;
        Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
            if (referenceNode && referenceNode.parentNode !== this) {
                if (process.env.NODE_ENV !== 'production') {
                    console.warn('Node.insertBefore: The reference node is not a child of this node.', referenceNode);
                }
                return newNode;
            }
            return originalInsertBefore.call(this, newNode, referenceNode) as T;
        };
    }, []);

    return null;
}
