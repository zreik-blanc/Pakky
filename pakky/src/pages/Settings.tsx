import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { Settings as SettingsIcon, User, Info, Trash2, LogOut, AlertTriangle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { userConfigAPI, systemAPI } from '@/lib/electron';
import { APP, UI_STRINGS } from '@/lib/constants';
import type { UserConfig } from '@/lib/types';
import { pageEnter, spinnerTransition, smoothSpring } from '@/lib/animations';

export default function SettingsPage() {
    const [userConfig, setUserConfig] = useState<UserConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [editName, setEditName] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [showResetDialog, setShowResetDialog] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    useEffect(() => {
        const loadConfig = async () => {
            try {
                const config = await userConfigAPI.read();
                setUserConfig(config);
                setEditName(config?.userName || '');
            } catch (error) {
                console.error('Failed to load user config:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadConfig();
    }, []);

    const handleSaveName = async () => {
        if (!editName.trim()) return;
        setIsSaving(true);
        try {
            await userConfigAPI.save({ userName: editName.trim() });
            setUserConfig(prev => prev ? { ...prev, userName: editName.trim() } : null);
            setIsEditing(false);
            toast.success('Name saved!');
        } catch (error) {
            console.error('Failed to save name:', error);
            toast.error('Failed to save name.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleResetConfig = async () => {
        setIsResetting(true);
        try {
            await userConfigAPI.reset();
            window.location.reload();
        } catch (error) {
            console.error('Failed to reset config:', error);
            toast.error('Failed to reset config.');
            setIsResetting(false);
            setShowResetDialog(false);
        }
    };

    const handleQuit = async () => {
        try {
            await systemAPI.quitApp();
        } catch (error) {
            console.error('Failed to quit:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <motion.div
                    className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full"
                    animate={{ rotate: 360 }}
                    transition={spinnerTransition}
                />
            </div>
        );
    }

    return (
        <motion.div
            className="max-w-2xl mx-auto space-y-6 h-full overflow-y-auto overflow-x-hidden pb-8 scrollbar-hide"
            variants={pageEnter}
            initial="hidden"
            animate="visible"
        >
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                    <SettingsIcon className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{UI_STRINGS.SETTINGS.TITLE}</h2>
                    <p className="text-muted-foreground text-sm">{UI_STRINGS.SETTINGS.DESCRIPTION}</p>
                </div>
            </div>

            {/* User Profile */}
            <Card className="bg-card/50 border-border/50">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {UI_STRINGS.SETTINGS.PROFILE_TITLE}
                    </CardTitle>
                    <CardDescription>{UI_STRINGS.SETTINGS.PROFILE_DESCRIPTION}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{UI_STRINGS.SETTINGS.NAME_LABEL}</p>
                            {isEditing ? (
                                <div className="flex items-center gap-2 mt-1">
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        autoFocus
                                    />
                                    <Button size="sm" onClick={handleSaveName} disabled={isSaving}>
                                        {isSaving ? UI_STRINGS.SETTINGS.SAVING : UI_STRINGS.COMMON.SAVE}
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                                        {UI_STRINGS.COMMON.CANCEL}
                                    </Button>
                                </div>
                            ) : (
                                <p className="text-foreground">{userConfig?.userName || 'User'}</p>
                            )}
                        </div>
                        {!isEditing && (
                            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                                {UI_STRINGS.COMMON.EDIT}
                            </Button>
                        )}
                    </div>

                    {userConfig?.systemInfo && (
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{UI_STRINGS.SETTINGS.PLATFORM_LABEL}</p>
                                <p className="text-foreground capitalize">{userConfig.systemInfo.platform}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{UI_STRINGS.SETTINGS.ARCH_LABEL}</p>
                                <p className="text-foreground">{userConfig.systemInfo.arch}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{UI_STRINGS.SETTINGS.HOSTNAME_LABEL}</p>
                                <p className="text-foreground">{userConfig.systemInfo.hostname}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{UI_STRINGS.SETTINGS.FIRST_LAUNCH_LABEL}</p>
                                <p className="text-foreground">
                                    {userConfig.firstLaunchAt
                                        ? new Date(userConfig.firstLaunchAt).toLocaleDateString()
                                        : UI_STRINGS.COMMON.UNKNOWN}
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Security Level */}
            <Card className="bg-card/50 border-border/50">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Script Security Level
                    </CardTitle>
                    <CardDescription>
                        Controls how strictly imported configuration scripts are validated
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {(['STRICT', 'STANDARD', 'PERMISSIVE'] as const).map((level) => {
                        const isSelected = (userConfig?.securityLevel || 'STRICT') === level;
                        const config = {
                            STRICT: {
                                name: 'Strict',
                                description: 'Only safe commands allowed. No network or package installations in scripts.',
                                badge: 'Recommended',
                                badgeClass: 'bg-green-500/10 text-green-500 border-green-500/20',
                                selectedBorder: 'border-green-500',
                                selectedBg: 'bg-green-500/5',
                                radioColor: 'border-green-500',
                                dotColor: 'bg-green-500',
                            },
                            STANDARD: {
                                name: 'Standard',
                                description: 'Allows package managers and git in scripts. For trusted configs.',
                                badge: null,
                                badgeClass: '',
                                selectedBorder: 'border-amber-500',
                                selectedBg: 'bg-amber-500/5',
                                radioColor: 'border-amber-500',
                                dotColor: 'bg-amber-500',
                            },
                            PERMISSIVE: {
                                name: 'Permissive',
                                description: 'Allows most operations with warnings. Only for fully trusted configs.',
                                badge: 'Use with caution',
                                badgeClass: 'bg-red-500/10 text-red-500 border-red-500/20',
                                selectedBorder: 'border-red-500',
                                selectedBg: 'bg-red-500/5',
                                radioColor: 'border-red-500',
                                dotColor: 'bg-red-500',
                            },
                        }[level];

                        return (
                            <motion.div
                                key={level}
                                className={`relative flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${isSelected
                                    ? `${config.selectedBorder} ${config.selectedBg}`
                                    : 'border-border/50 hover:border-border hover:bg-muted/30'
                                    }`}
                                onClick={async () => {
                                    if (!isSelected) {
                                        try {
                                            await userConfigAPI.save({ securityLevel: level });
                                            setUserConfig(prev => prev ? { ...prev, securityLevel: level } : null);
                                            toast.success(`Security level set to ${level.toLowerCase()}.`);
                                        } catch (error) {
                                            console.error('Failed to save security level:', error);
                                            toast.error('Failed to save security level.');
                                        }
                                    }
                                }}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                transition={smoothSpring}
                            >
                                <motion.div
                                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? config.radioColor : 'border-muted-foreground/30'
                                        }`}
                                    animate={{ scale: isSelected ? 1 : 0.9 }}
                                    transition={smoothSpring}
                                >
                                    {isSelected && (
                                        <motion.div
                                            className={`w-2 h-2 rounded-full ${config.dotColor}`}
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={smoothSpring}
                                        />
                                    )}
                                </motion.div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">{config.name}</span>
                                        {config.badge && (
                                            <span className={`text-xs px-1.5 py-0.5 rounded border ${config.badgeClass}`}>
                                                {config.badge}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">{config.description}</p>
                                </div>
                            </motion.div>
                        );
                    })}
                </CardContent>
            </Card>

            {/* About */}
            <Card className="bg-card/50 border-border/50">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        {UI_STRINGS.SETTINGS.ABOUT_TITLE}
                    </CardTitle>
                    <CardDescription>{UI_STRINGS.SETTINGS.ABOUT_DESCRIPTION}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{UI_STRINGS.SETTINGS.VERSION_LABEL}</p>
                            <p className="text-foreground">{APP.VERSION}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">{UI_STRINGS.SETTINGS.PACKAGE_MANAGER_LABEL}</p>
                            <p className="text-foreground">{APP.PACKAGE_MANAGER}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="bg-destructive/5 border-destructive/20">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base text-destructive flex items-center gap-2">
                        <Trash2 className="w-4 h-4" />
                        {UI_STRINGS.SETTINGS.DANGER_ZONE_TITLE}
                    </CardTitle>
                    <CardDescription>{UI_STRINGS.SETTINGS.DANGER_ZONE_DESCRIPTION}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">{UI_STRINGS.SETTINGS.RESET_TITLE}</p>
                            <p className="text-xs text-muted-foreground">{UI_STRINGS.SETTINGS.RESET_DESCRIPTION}</p>
                        </div>
                        <Button variant="destructive" size="sm" onClick={() => setShowResetDialog(true)} className="w-24">
                            {UI_STRINGS.SETTINGS.RESET_BUTTON}
                        </Button>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-destructive/10">
                        <div>
                            <p className="text-sm font-medium">{UI_STRINGS.SETTINGS.QUIT_TITLE}</p>
                            <p className="text-xs text-muted-foreground">{UI_STRINGS.SETTINGS.QUIT_DESCRIPTION}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleQuit} className="w-24">
                            <LogOut className="w-4 h-4 mr-2" />
                            {UI_STRINGS.COMMON.QUIT}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Reset Confirmation Dialog */}
            <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-destructive" />
                            </div>
                            <div>
                                <DialogTitle>{UI_STRINGS.SETTINGS.RESET_DIALOG_TITLE}</DialogTitle>
                                <DialogDescription className="mt-1">
                                    {UI_STRINGS.SETTINGS.RESET_DIALOG_DESCRIPTION}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm text-muted-foreground">
                            {UI_STRINGS.SETTINGS.RESET_WARNING}
                        </p>
                        <ul className="mt-2 text-sm text-muted-foreground list-disc list-inside space-y-1">
                            {UI_STRINGS.SETTINGS.RESET_WARNING_ITEMS.map((item, i) => (
                                <li key={i}>{item}</li>
                            ))}
                        </ul>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setShowResetDialog(false)}
                            disabled={isResetting}
                        >
                            {UI_STRINGS.COMMON.CANCEL}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleResetConfig}
                            disabled={isResetting}
                        >
                            {isResetting ? (
                                <>
                                    <motion.div
                                        className="w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"
                                        animate={{ rotate: 360 }}
                                        transition={spinnerTransition}
                                    />
                                    {UI_STRINGS.SETTINGS.RESETTING_BUTTON}
                                </>
                            ) : (
                                UI_STRINGS.SETTINGS.RESET_TITLE
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}
