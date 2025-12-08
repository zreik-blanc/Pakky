import { useState, useEffect, useRef } from "react"
import { Search, Loader2, Package, Terminal, Check, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { searchAPI } from "@/lib/electron"
import { cn } from "@/lib/utils"
import { SearchResult } from "@/lib/types"
import { SEARCH_CONFIG } from "@/lib/config"

interface PackageSearchProps {
    onAddPackage: (result: SearchResult) => Promise<void>
    disabled?: boolean
    isAdded: (id: string) => boolean
}

export function PackageSearch({ onAddPackage, disabled, isAdded }: PackageSearchProps) {
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<SearchResult[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [loadingId, setLoadingId] = useState<string | null>(null)
    const [selectedIndex, setSelectedIndex] = useState(-1)
    const containerRef = useRef<HTMLDivElement>(null)

    // Subscript to clicks outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    // Debounced search
    useEffect(() => {
        if (query.length < SEARCH_CONFIG.minQueryLength) {
            setResults([])
            setIsOpen(false)
            return
        }

        const timer = setTimeout(async () => {
            setIsSearching(true)
            try {
                const searchResults = await searchAPI.searchBrew(query)
                setResults(searchResults)
                setIsOpen(searchResults.length > 0)
                setSelectedIndex(-1)  // Reset selection on new search
            } catch (error) {
                console.error("Search failed:", error)
                setResults([])
            } finally {
                setIsSearching(false)
            }
        }, SEARCH_CONFIG.debounceMs)

        return () => clearTimeout(timer)
    }, [query])

    const handleAdd = async (result: SearchResult) => {
        setLoadingId(result.name)
        try {
            await onAddPackage(result)
            // Don't close immediately allows multiple adds if we wanted, but here logic clears query usually
            setQuery("")
            setIsOpen(false)
        } finally {
            setLoadingId(null)
        }
    }

    return (
        <div className="relative" ref={containerRef}>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {isSearching ? (
                        <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                    ) : (
                        <Search className="w-4 h-4 text-muted-foreground" />
                    )}
                </div>
                <Input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value)
                        if (e.target.value.length >= 2 && !isOpen && results.length > 0) {
                            setIsOpen(true)
                        }
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                            setIsOpen(false)
                            setQuery('')
                            setSelectedIndex(-1)
                        } else if (e.key === 'ArrowDown') {
                            e.preventDefault()
                            if (!isOpen && results.length > 0) {
                                setIsOpen(true)
                            }
                            setSelectedIndex(prev =>
                                prev < results.length - 1 ? prev + 1 : prev
                            )
                        } else if (e.key === 'ArrowUp') {
                            e.preventDefault()
                            setSelectedIndex(prev => prev > 0 ? prev - 1 : 0)
                        } else if (e.key === 'Enter' && selectedIndex >= 0) {
                            e.preventDefault()
                            const selected = results[selectedIndex]
                            if (selected && !isAdded(`${selected.type}:${selected.name}`)) {
                                handleAdd(selected)
                            }
                        }
                    }}
                    disabled={disabled}
                    placeholder={disabled ? "Installation in progress..." : "Search packages (e.g. git, node, vscode)..."}
                    className="pl-10 h-12 bg-background/50 border-input/50 focus:bg-background transition-colors"
                />
            </div>

            {isOpen && results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-popover/95 backdrop-blur-xl border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <ScrollArea className="max-h-[300px]">
                        <div className="p-1">
                            {results.map((result, index) => {
                                const id = `${result.type}:${result.name}`
                                const added = isAdded(id)
                                const isLoading = loadingId === result.name
                                const isSelected = index === selectedIndex

                                return (
                                    <button
                                        key={id}
                                        onClick={() => !added && handleAdd(result)}
                                        disabled={added || isLoading}
                                        className={cn(
                                            "w-full px-3 py-3 flex items-center gap-3 text-left rounded-lg transition-colors",
                                            added ? "opacity-50 cursor-default" : "hover:bg-accent cursor-pointer",
                                            isSelected && !added && "bg-accent ring-1 ring-primary/50"
                                        )}
                                    >
                                        <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                                            {result.type === 'cask' ? (
                                                <Package className="w-4 h-4 text-primary" />
                                            ) : (
                                                <Terminal className="w-4 h-4 text-emerald-500" />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="font-medium text-sm text-foreground">{result.name}</span>
                                                {result.installed && (
                                                    <span className="text-[10px] text-emerald-500 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded-full">installed</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-[10px] h-4 px-1 py-0 border-border/50 text-muted-foreground">
                                                    {result.type}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                    {result.description}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="pr-1">
                                            {isLoading ? (
                                                <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                                            ) : added ? (
                                                <Check className="w-4 h-4 text-emerald-500" />
                                            ) : (
                                                <Plus className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </div>
            )}
        </div>
    )
}
