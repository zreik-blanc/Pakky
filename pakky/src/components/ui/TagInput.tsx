/**
 * TagInput Component
 * Input field for adding/removing tags with suggestions
 */

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { X, Sparkles } from 'lucide-react';
import { MAX_TAGS } from '@/lib/constants';

interface TagInputProps {
    tags: string[];
    suggestions: string[];
    onChange: (tags: string[]) => void;
    placeholder?: string;
    maxSuggestions?: number;
    maxTags?: number;
}

export function TagInput({
    tags,
    suggestions,
    onChange,
    placeholder = "Add tags...",
    maxSuggestions = 6,
    maxTags = MAX_TAGS,
}: TagInputProps) {
    const [inputValue, setInputValue] = useState('');
    const isAtLimit = tags.length >= maxTags;

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            if (isAtLimit) return;
            const newTag = inputValue.trim().toLowerCase();
            if (newTag && !tags.includes(newTag)) {
                onChange([...tags, newTag]);
            }
            setInputValue('');
        } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
            onChange(tags.slice(0, -1));
        }
    };

    const removeTag = (tagToRemove: string) => {
        onChange(tags.filter(t => t !== tagToRemove));
    };

    const addSuggestion = (suggestion: string) => {
        if (isAtLimit) return;
        if (!tags.includes(suggestion)) {
            onChange([...tags, suggestion]);
        }
    };

    const unusedSuggestions = suggestions.filter(s => !tags.includes(s));

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5 p-2 min-h-[42px] rounded-md border border-input bg-background">
                {tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                        {tag}
                        <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="hover:bg-muted rounded-full p-0.5"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </Badge>
                ))}
                {!isAtLimit && (
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={tags.length === 0 ? placeholder : ""}
                        className="flex-1 min-w-[80px] bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                    />
                )}
            </div>
            {isAtLimit && (
                <p className="text-xs text-muted-foreground">
                    Maximum {maxTags} tags reached
                </p>
            )}
            {!isAtLimit && unusedSuggestions.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Suggestions:
                    </span>
                    {unusedSuggestions.slice(0, maxSuggestions).map(suggestion => (
                        <button
                            key={suggestion}
                            type="button"
                            onClick={() => addSuggestion(suggestion)}
                            className="text-xs px-2 py-0.5 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                        >
                            + {suggestion}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
