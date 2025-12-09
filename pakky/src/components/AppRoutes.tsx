import HomePage from '@/pages/Home';
import PresetsPage from '@/pages/Presets';
import SettingsPage from '@/pages/Settings';
import type { SystemInfo, PackageInstallItem, UserConfig } from '@/lib/types';

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
    onNavigate
}: AppRoutesProps) {
    if (currentPage === 'settings') {
        return <SettingsPage />;
    }

    if (currentPage === 'presets') {
        return (
            <PresetsPage
                onLoadPreset={(packages) => {
                    setSelectedPackages(prev => {
                        const existingIds = new Set(prev.map(p => p.id));
                        const newPackages = packages.filter(p => !existingIds.has(p.id));
                        return [...prev, ...newPackages];
                    });
                    onNavigate('home');
                }}
            />
        );
    }

    // Default to home
    return (
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
        />
    );
}
