/**
 * Safely copies text to the clipboard, falling back to a temporary textarea element
 * if navigator.clipboard is not supported/accessible (e.g. in some in-app browsers, older iOS, webviews, or non-secure contexts).
 */
export async function copyToClipboardSafe(text: string): Promise<boolean> {
    if (!text) return false;

    // Try modern Clipboard API first
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.warn('Modern clipboard copy failed, trying fallback method:', err);
        }
    }

    // Fallback method using document.execCommand('copy')
    if (typeof document !== 'undefined') {
        try {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            
            // Prevent scrolling on mobile devices and hide the element
            textArea.style.top = '0';
            textArea.style.left = '0';
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            textArea.style.pointerEvents = 'none';

            document.body.appendChild(textArea);
            
            // Highlight and copy
            textArea.focus();
            textArea.select();

            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);

            if (successful) {
                return true;
            }
        } catch (err) {
            console.error('Fallback copy method failed:', err);
        }
    }

    return false;
}
