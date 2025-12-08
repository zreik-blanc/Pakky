import { Settings as SettingsIcon } from 'lucide-react';

export default function SettingsPage() {
    return (
        <div className="h-full flex items-center justify-center animate-in zoom-in-95 duration-500 fade-in">
            <div className="text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <SettingsIcon className="w-8 h-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Settings</h2>
                <p className="text-muted-foreground mt-2">App settings coming soon...</p>
            </div>
        </div>
    );
}
