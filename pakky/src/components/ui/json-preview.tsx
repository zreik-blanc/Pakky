import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface JsonPreviewProps {
    data: unknown;
    className?: string;
}

interface HighlightedToken {
    text: string;
    className: string;
}

/**
 * Safely tokenize and highlight JSON without using dangerouslySetInnerHTML
 * This prevents any XSS vulnerabilities by using React elements instead of raw HTML
 */
function tokenizeJson(json: string): HighlightedToken[] {
    const tokens: HighlightedToken[] = [];
    const regex = /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g;

    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(json)) !== null) {
        // Add non-matched text before this match
        if (match.index > lastIndex) {
            tokens.push({
                text: json.slice(lastIndex, match.index),
                className: 'text-gray-300' // default text color
            });
        }

        // Determine the color class based on token type
        let cls = 'text-orange-400'; // number
        if (/^"/.test(match[0])) {
            if (/:$/.test(match[0])) {
                cls = 'text-sky-400'; // key
            } else {
                cls = 'text-emerald-400'; // string
            }
        } else if (/true|false/.test(match[0])) {
            cls = 'text-purple-400'; // boolean
        } else if (/null/.test(match[0])) {
            cls = 'text-gray-500'; // null
        }

        tokens.push({ text: match[0], className: cls });
        lastIndex = regex.lastIndex;
    }

    // Add any remaining text after the last match
    if (lastIndex < json.length) {
        tokens.push({
            text: json.slice(lastIndex),
            className: 'text-gray-300'
        });
    }

    return tokens;
}

export function JsonPreview({ data, className }: JsonPreviewProps) {
    const tokens = useMemo(() => {
        // Handle undefined explicitly
        if (data === undefined) {
            return tokenizeJson('"undefined"');
        }

        try {
            // Track seen objects to detect circular references
            const seen = new WeakSet<object>();

            const json = JSON.stringify(data, (_key, value) => {
                // Handle non-object values directly
                if (value === null || typeof value !== 'object') {
                    return value;
                }

                // Check for circular reference
                if (seen.has(value)) {
                    return '[Circular]';
                }

                seen.add(value);
                return value;
            }, 2);

            // JSON.stringify returns undefined for some edge cases
            if (json === undefined) {
                return tokenizeJson('"unserializable value"');
            }

            return tokenizeJson(json);
        } catch {
            // Fallback for any stringify errors
            return tokenizeJson('"unserializable value"');
        }
    }, [data]);

    return (
        <pre className={cn("font-mono text-xs leading-relaxed whitespace-pre-wrap break-all", className)}>
            {tokens.map((token, index) => (
                <span key={index} className={token.className}>
                    {token.text}
                </span>
            ))}
        </pre>
    );
}
