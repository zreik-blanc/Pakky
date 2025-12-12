import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface JsonPreviewProps {
    data: unknown;
    className?: string;
}

export function JsonPreview({ data, className }: JsonPreviewProps) {
    const htmlInfo = useMemo(() => {
        const json = JSON.stringify(data, null, 2);

        // Simple regex-based syntax highlighting
        const highlighted = json.replace(
            /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
            (match) => {
                let cls = 'text-orange-400'; // number
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) {
                        cls = 'text-sky-400'; // key
                    } else {
                        cls = 'text-emerald-400'; // string
                    }
                } else if (/true|false/.test(match)) {
                    cls = 'text-purple-400'; // boolean
                } else if (/null/.test(match)) {
                    cls = 'text-gray-500'; // null
                }
                return `<span class="${cls}">${match}</span>`;
            }
        );

        return { __html: highlighted };
    }, [data]);

    return (
        <pre
            className={cn("font-mono text-xs leading-relaxed whitespace-pre-wrap break-all", className)}
            dangerouslySetInnerHTML={htmlInfo} // Safe because we just stringified JSON
        />
    );
}
