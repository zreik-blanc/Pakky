/**
 * ToggleSwitch Component
 * A custom toggle switch with label and optional description
 */

interface ToggleSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    description?: string;
}

export function ToggleSwitch({
    checked,
    onChange,
    label,
    description
}: ToggleSwitchProps) {
    return (
        <label className="flex items-start gap-3 cursor-pointer group">
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={`
                    relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                    transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 
                    focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background
                    ${checked ? 'bg-primary' : 'bg-muted'}
                `}
            >
                <span
                    className={`
                        pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow-lg 
                        ring-0 transition duration-200 ease-in-out
                        ${checked ? 'translate-x-4' : 'translate-x-0'}
                    `}
                />
            </button>
            <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium leading-none group-hover:text-foreground transition-colors">
                    {label}
                </span>
                {description && (
                    <span className="text-xs text-muted-foreground">{description}</span>
                )}
            </div>
        </label>
    );
}
