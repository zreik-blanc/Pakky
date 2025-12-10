import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import type { SystemInfo, PackageInstallItem, UserConfig } from '@/lib/types';
import { QueueManager } from '@/lib/managers/queueManager';

// Lazy load pages for code splitting
const HomePage = lazy(() => import('@/pages/Home'));
const PresetsPage = lazy(() => import('@/pages/Presets'));
const SettingsPage = lazy(() => import('@/pages/Settings'));

// Loading fallback component
function PageLoader() {
    return (
        <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
        </div>
    );
}

interface AppRoutesProps {
    currentPage: 'home' | 'presets' | 'settings';
    systemInfo: SystemInfo | null;
    userConfig: UserConfig | null;
    importedPackages: PackageInstallItem[];
    setImportedPackages: (packages: PackageInstallItem[]) => void;
    selectedPackages: PackageInstallItem[];
    setSelectedPackages: React.Dispatch<React.SetStateAction<PackageInstallItem[]>>;
    installLogs: Record<string, string[]>;
    setInstallLogs: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
    onNavigate: (page: 'home' | 'presets' | 'settings') => void;
    hasImportedConfig: boolean;
    onClearImportedFlag: () => void;
}

export function AppRoutes({
    currentPage,
    systemInfo,
    userConfig,
    importedPackages,
    setImportedPackages,
    selectedPackages,
    setSelectedPackages,
    installLogs,
    setInstallLogs,
    onNavigate,
    hasImportedConfig,
    onClearImportedFlag
}: AppRoutesProps) {
    if (currentPage === 'settings') {
        return (
            <Suspense fallback={<PageLoader />}>
                <SettingsPage />
            </Suspense>
        );
    }

    if (currentPage === 'presets') {
        return (
            <Suspense fallback={<PageLoader />}>
                <PresetsPage
                    onLoadPreset={(packages) => {
                        setSelectedPackages(prev => QueueManager.merge(prev, packages));
                        onNavigate('home');
                    }}
                />
            </Suspense>
        );
    }

    // Default to home
    return (
        <Suspense fallback={<PageLoader />}>
            <HomePage
                systemInfo={systemInfo}
                userConfig={userConfig}
                importedPackages={importedPackages}
                onClearImported={() => setImportedPackages([])}
                selectedPackages={selectedPackages}
                setSelectedPackages={setSelectedPackages}
                installLogs={installLogs}
                setInstallLogs={setInstallLogs}
                onNavigateToPresets={() => onNavigate('presets')}
                hasImportedConfig={hasImportedConfig}
                onClearImportedFlag={onClearImportedFlag}
            />
        </Suspense>
    );
}
