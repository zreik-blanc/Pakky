import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, User, Info, Trash2, LogOut, AlertTriangle } from 'lucide-react';
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
import { APP_CONFIG } from '@/lib/config';
import type { UserConfig } from '@/lib/types';

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
        } catch (error) {
            console.error('Failed to save name:', error);
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
                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                    <SettingsIcon className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                    <p className="text-muted-foreground text-sm">Manage your preferences</p>
                </div>
            </div>

            {/* User Profile */}
            <Card className="bg-card/50 border-border/50">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Profile
                    </CardTitle>
                    <CardDescription>Your personal information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Name</p>
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
                                        {isSaving ? 'Saving...' : 'Save'}
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                                        Cancel
                                    </Button>
                                </div>
                            ) : (
                                <p className="text-foreground">{userConfig?.userName || 'User'}</p>
                            )}
                        </div>
                        {!isEditing && (
                            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                                Edit
                            </Button>
                        )}
                    </div>

                    {userConfig?.systemInfo && (
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Platform</p>
                                <p className="text-foreground capitalize">{userConfig.systemInfo.platform}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Architecture</p>
                                <p className="text-foreground">{userConfig.systemInfo.arch}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Hostname</p>
                                <p className="text-foreground">{userConfig.systemInfo.hostname}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">First Launch</p>
                                <p className="text-foreground">
                                    {userConfig.firstLaunchAt
                                        ? new Date(userConfig.firstLaunchAt).toLocaleDateString()
                                        : 'Unknown'}
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* About */}
            <Card className="bg-card/50 border-border/50">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        About
                    </CardTitle>
                    <CardDescription>Application information</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Version</p>
                            <p className="text-foreground">{APP_CONFIG.version}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Package Manager</p>
                            <p className="text-foreground">{APP_CONFIG.packageManager}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="bg-destructive/5 border-destructive/20">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base text-destructive flex items-center gap-2">
                        <Trash2 className="w-4 h-4" />
                        Danger Zone
                    </CardTitle>
                    <CardDescription>Irreversible actions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">Reset Configuration</p>
                            <p className="text-xs text-muted-foreground">Clear all settings and restart onboarding</p>
                        </div>
                        <Button variant="destructive" size="sm" onClick={() => setShowResetDialog(true)}>
                            Reset
                        </Button>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-destructive/10">
                        <div>
                            <p className="text-sm font-medium">Quit Application</p>
                            <p className="text-xs text-muted-foreground">Close Pakky completely</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleQuit}>
                            <LogOut className="w-4 h-4 mr-2" />
                            Quit
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
                                <DialogTitle>Reset Configuration</DialogTitle>
                                <DialogDescription className="mt-1">
                                    This action cannot be undone.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm text-muted-foreground">
                            Are you sure you want to reset your configuration? This will:
                        </p>
                        <ul className="mt-2 text-sm text-muted-foreground list-disc list-inside space-y-1">
                            <li>Clear all your settings</li>
                            <li>Remove your profile information</li>
                            <li>Restart the onboarding process</li>
                        </ul>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setShowResetDialog(false)}
                            disabled={isResetting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleResetConfig}
                            disabled={isResetting}
                        >
                            {isResetting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                                    Resetting...
                                </>
                            ) : (
                                'Reset Configuration'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
