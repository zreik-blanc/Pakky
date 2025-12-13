import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { Play, Square, Loader2, Download, PackageOpen, Sparkles, Search, Plus, Trash2, ScrollText, GripVertical } from 'lucide-react';
import type { PackageInstallItem, ConfigSettings } from '@/lib/types';
import { PackageCard } from '@/components/packages/PackageCard';
import { Button } from '@/components/ui/button';
import { InstallSettingsPopover } from '@/components/install/InstallSettingsPopover';
import { cn } from '@/lib/utils';
import { UI_STRINGS } from '@/lib/constants';
import {
    fadeIn,
    bounceTransition,
    pulseTransition,
    spinnerTransition,
    scaleIn,
} from '@/lib/animations';
import React from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface PackageQueueProps {
    packages: PackageInstallItem[];
    installLogs: Record<string, string[]>;
    isInstalling: boolean;
    isStartingInstall: boolean;
    installSettings: ConfigSettings;
    onInstallSettingsChange: (settings: ConfigSettings) => void;
    onRemove: (id: string) => void;
    onReinstall: (id: string) => void;
    onReorder: (packages: PackageInstallItem[]) => void;
    onStartInstall: () => void;
    onCancelInstall: () => void;
    onExport: () => void;
    onClear: () => void;
    onNavigateToPresets?: () => void;
    onAddScript?: () => void;
}

// Sortable package item wrapper
function SortablePackageItem({
    pkg,
    onRemove,
    onReinstall,
    disabled,
    logs,
    isDragDisabled,
}: {
    pkg: PackageInstallItem;
    onRemove: (id: string) => void;
    onReinstall: (id: string) => void;
    disabled: boolean;
    logs: string[];
    isDragDisabled: boolean;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: pkg.id, disabled: isDragDisabled });

    // Smooth transition for all sortable items - this makes them slide when reordering
    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition: transition || 'transform 250ms cubic-bezier(0.25, 1, 0.5, 1)',
        opacity: isDragging ? 0.3 : 1, // Show faded placeholder where item was
        zIndex: isDragging ? 0 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "relative group/sortable",
                isDragging && "pointer-events-none"
            )}
        >
            {/* Drag handle */}
            {!isDragDisabled && (
                <div
                    {...attributes}
                    {...listeners}
                    className="absolute left-0 top-0 bottom-0 w-6 flex items-center justify-center opacity-0 group-hover/sortable:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10"
                >
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                </div>
            )}
            <div className={cn(!isDragDisabled && "pl-6")}>
                <PackageCard
                    pkg={pkg}
                    onRemove={onRemove}
                    onReinstall={onReinstall}
                    disabled={disabled}
                    logs={logs}
                />
            </div>
        </div>
    );
}

function EmptyQueue({
    onNavigateToPresets,
    onAddScript
}: {
    onNavigateToPresets?: () => void,
    onAddScript?: () => void
}) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const rotateX = useTransform(y, [-50, 50], [15, -15]);
    const rotateY = useTransform(x, [-50, 50], [-15, 15]);

    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        x.set(event.clientX - centerX);
        y.set(event.clientY - centerY);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            className="h-full flex flex-col items-center justify-center text-center p-8"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
        >
            {/* Animated illustration */}
            <div className="relative mb-8 perspective-1000">
                {/* Floating background elements */}
                {[
                    { position: '-top-4 -left-6', size: 'w-3 h-3', color: 'bg-primary/30', delay: 0.1, duration: 2 },
                    { position: '-top-2 -right-4', size: 'w-2 h-2', color: 'bg-primary/20', delay: 0.3, duration: 2.5 },
                    { position: '-bottom-3 -left-3', size: 'w-2.5 h-2.5', color: 'bg-emerald-500/30', delay: 0.5, duration: 2.2 },
                    { position: '-bottom-1 right-0', size: 'w-2 h-2', color: 'bg-emerald-500/20', delay: 0.7, duration: 2.8 },
                ].map((dot, i) => (
                    <motion.div
                        key={i}
                        className={`absolute ${dot.position} ${dot.size} ${dot.color} rounded-full`}
                        animate={{ y: [0, -8, 0] }}
                        transition={{ ...bounceTransition, delay: dot.delay, duration: dot.duration }}
                    />
                ))}

                {/* Main icon container with Tilt Effect */}
                <div style={{ perspective: 1000 }}>
                    <motion.div
                        className="w-24 h-24 bg-gradient-to-br from-card to-muted rounded-2xl flex items-center justify-center border border-border/50 shadow-lg relative overflow-hidden cursor-pointer"
                        style={{
                            rotateX,
                            rotateY,
                            transformStyle: "preserve-3d"
                        }}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                        {/* Shimmer effect on hover */}
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                            initial={{ x: '-100%' }}
                            whileHover={{ x: '100%' }}
                            transition={{ duration: 1 }}
                        />
                        <PackageOpen className="w-10 h-10 text-muted-foreground/60" style={{ transform: "translateZ(20px)" }} />
                    </motion.div>
                </div>

                {/* Plus icon floating */}
                <motion.div
                    className="absolute -right-3 -top-3 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20"
                    animate={{ opacity: [0.6, 1, 0.6], scale: [0.95, 1, 0.95] }}
                    transition={pulseTransition}
                    style={{ translateZ: 30 }}
                >
                    <Plus className="w-4 h-4 text-primary" />
                </motion.div>
            </div>

            <div className="space-y-2 mb-8 max-w-md">
                <h3 className="text-xl font-semibold tracking-tight">{UI_STRINGS.QUEUE.EMPTY_TITLE}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                    {UI_STRINGS.QUEUE.EMPTY_DESCRIPTION}
                </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
                {onNavigateToPresets && (
                    <Button
                        variant="default"
                        className="gap-2 shadow-sm hover:shadow-md transition-shadow duration-200"
                        onClick={onNavigateToPresets}
                    >
                        <Sparkles className="w-4 h-4" />
                        {UI_STRINGS.QUEUE.BROWSE_PRESETS}
                    </Button>
                )}
                <Button
                    variant="outline"
                    className="gap-2 hover:bg-accent/50 transition-colors duration-200"
                    onClick={() => document.querySelector<HTMLInputElement>('input[type="text"]')?.focus()}
                >
                    <Search className="w-4 h-4" />
                    {UI_STRINGS.QUEUE.SEARCH_PACKAGES}
                </Button>
                {onAddScript && (
                    <Button
                        variant="outline"
                        className="gap-2 hover:bg-accent/50 transition-colors duration-200"
                        onClick={onAddScript}
                    >
                        <ScrollText className="w-4 h-4" />
                        {UI_STRINGS.QUEUE.ADD_SCRIPT}
                    </Button>
                )}
            </div>

            {/* Tip */}
            <motion.div
                className="mt-8 px-4 py-2.5 bg-muted/30 rounded-lg border border-border/30 text-xs text-muted-foreground"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                {UI_STRINGS.HOME.TIP_CONFIG}
            </motion.div>
        </motion.div>
    );
}

export function PackageQueue({
    packages,
    installLogs,
    isInstalling,
    isStartingInstall,
    installSettings,
    onInstallSettingsChange,
    onRemove,
    onReinstall,
    onReorder,
    onStartInstall,
    onCancelInstall,
    onExport,
    onClear,
    onNavigateToPresets,
    onAddScript
}: PackageQueueProps) {
    // Track active dragging item
    const [activeId, setActiveId] = React.useState<string | null>(null);
    const activeItem = activeId ? packages.find(p => p.id === activeId) : null;

    // dnd-kit sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // 8px movement required before drag starts
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Handle drag start - track active item for overlay
    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    // Handle drag end - reorder packages and update positions
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (over && active.id !== over.id) {
            const oldIndex = packages.findIndex((p) => p.id === active.id);
            const newIndex = packages.findIndex((p) => p.id === over.id);

            const reordered = arrayMove(packages, oldIndex, newIndex);
            // Update positions to reflect new order
            const withUpdatedPositions = reordered.map((pkg, index) => ({
                ...pkg,
                position: index + 1,
            }));
            onReorder(withUpdatedPositions);
        }
    };

    // Packages that can still be installed/retried (not completed)
    const pendingPackages = packages.filter(p =>
        p.status === 'pending' || p.status === 'checking' || p.status === 'installing'
    );
    // Packages that can be installed (pending, skipped, or failed - for showing Install button)
    const installablePackages = packages.filter(p =>
        p.status === 'pending' || p.status === 'skipped' || p.status === 'failed'
    );
    // Packages that are done (success or already installed)
    const completedPackages = packages.filter(p =>
        p.status === 'success' || p.status === 'already_installed'
    );

    if (packages.length === 0) {
        return <EmptyQueue onNavigateToPresets={onNavigateToPresets} onAddScript={onAddScript} />;
    }

    return (
        <motion.div
            className="flex flex-col h-full"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
        >
            {/* Queue header - Fixed, doesn't scroll */}
            <div className="flex items-center justify-between bg-background py-3 border-b border-border/50 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-base">Queue</span>
                        <motion.span
                            className={cn(
                                "px-2 py-0.5 rounded-full text-xs font-medium",
                                pendingPackages.length > 0
                                    ? "bg-primary/10 text-primary"
                                    : "bg-muted text-muted-foreground"
                            )}
                            key={pendingPackages.length}
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        >
                            {pendingPackages.length} {UI_STRINGS.QUEUE.PENDING}
                        </motion.span>
                    </div>
                    {packages.length > pendingPackages.length && (
                        <span className="text-xs text-muted-foreground">
                            • {completedPackages.length} {UI_STRINGS.QUEUE.INSTALLED}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Install Settings */}
                    {!isInstalling && packages.length > 0 && (
                        <InstallSettingsPopover
                            settings={installSettings}
                            onChange={onInstallSettingsChange}
                            disabled={isInstalling}
                        />
                    )}

                    {!isInstalling && onAddScript && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onAddScript}
                            className="h-8 gap-2 text-muted-foreground hover:text-amber-500 transition-colors"
                        >
                            <ScrollText className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Add Script</span>
                        </Button>
                    )}

                    {!isInstalling && packages.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onExport}
                            className="h-8 gap-2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{UI_STRINGS.QUEUE.EXPORT}</span>
                        </Button>
                    )}

                    {/* Clear button */}
                    <AnimatePresence>
                        {!isInstalling && packages.length > 0 && (
                            <motion.div
                                variants={scaleIn}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                            >
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onClear}
                                    className="h-8 gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">{UI_STRINGS.QUEUE.CLEAR}</span>
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {installablePackages.length > 0 && (
                        <>
                            {isInstalling ? (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={onCancelInstall}
                                    className="h-8 shadow-sm gap-2 hover:shadow-md transition-shadow duration-200"
                                >
                                    <Square className="w-3 h-3 fill-current" />
                                    {UI_STRINGS.COMMON.CANCEL}
                                </Button>
                            ) : (
                                <Button
                                    size="sm"
                                    onClick={onStartInstall}
                                    disabled={isStartingInstall}
                                    className="h-8 shadow-sm bg-primary hover:bg-primary/90 gap-2 hover:shadow-md transition-shadow duration-200"
                                >
                                    {isStartingInstall ? (
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={spinnerTransition}
                                        >
                                            <Loader2 className="w-3.5 h-3.5" />
                                        </motion.div>
                                    ) : (
                                        <Play className="w-3 h-3 fill-current" />
                                    )}
                                    {isStartingInstall ? UI_STRINGS.QUEUE.CHECKING : UI_STRINGS.QUEUE.INSTALL_ALL}
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Package list with drag-and-drop - Scrollable */}
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pt-4 scrollbar-hide">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={packages.map(p => p.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="grid gap-2.5 pb-6">
                            {packages.map((pkg) => (
                                <SortablePackageItem
                                    key={pkg.id}
                                    pkg={pkg}
                                    onRemove={onRemove}
                                    onReinstall={onReinstall}
                                    disabled={isInstalling}
                                    logs={installLogs[pkg.id] || []}
                                    isDragDisabled={isInstalling}
                                />
                            ))}
                        </div>
                    </SortableContext>

                    {/* Drag overlay - shows a floating card when dragging */}
                    <DragOverlay>
                        {activeItem && (
                            <motion.div
                                initial={{ scale: 1, rotate: 0 }}
                                animate={{ scale: 1.05, rotate: 1, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}
                                className="pl-6"
                            >
                                <PackageCard
                                    pkg={activeItem}
                                    onRemove={() => { }}
                                    onReinstall={() => { }}
                                    disabled={true}
                                    logs={[]}
                                />
                            </motion.div>
                        )}
                    </DragOverlay>
                </DndContext>
            </div>
        </motion.div>
    );
}
