/**
 * ToggleSwitch Component
 * A custom toggle switch with label and optional description
 * Now with smooth motion animations for the toggle knob
 */

import { motion } from 'motion/react';

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
            <motion.button
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
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
                <motion.span
                    className="pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-lg ring-0"
                    animate={{
                        x: checked ? 16 : 0,
                        scale: checked ? 1 : 0.9
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
            </motion.button>
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
