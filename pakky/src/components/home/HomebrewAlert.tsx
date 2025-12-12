import { motion } from 'motion/react';
import { Loader2, PackageOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { slideInFromTop, spinnerTransition } from '@/lib/animations';

interface HomebrewAlertProps {
    isInstalling: boolean;
    onInstall: () => void;
}

export function HomebrewAlert({ isInstalling, onInstall }: HomebrewAlertProps) {
    return (
        <motion.div
            className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex items-center justify-between"
            variants={slideInFromTop}
            initial="hidden"
            animate="visible"
        >
            <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-full text-yellow-600">
                    <PackageOpen className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-semibold text-yellow-700 dark:text-yellow-500">Homebrew is missing</h3>
                    <p className="text-sm text-yellow-600/80 dark:text-yellow-500/80">Pakky requires Homebrew to manage packages on macOS.</p>
                </div>
            </div>
            <Button
                onClick={onInstall}
                disabled={isInstalling}
                className="bg-yellow-600 hover:bg-yellow-700 text-white border-none shadow-sm"
            >
                {isInstalling ? (
                    <>
                        <motion.div
                            className="mr-2"
                            animate={{ rotate: 360 }}
                            transition={spinnerTransition}
                        >
                            <Loader2 className="w-4 h-4" />
                        </motion.div>
                        Installing...
                    </>
                ) : (
                    'Install Homebrew'
                )}
            </Button>
        </motion.div>
    );
}
