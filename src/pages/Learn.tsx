import { useEffect, useState, useCallback, useMemo } from "react";
import { educationApi } from "../lib/api-client";
import { normalizeApiError } from "../lib/api";
import type { Guide, Tip } from "../types/education";
import { GuideCard } from "../components/education/GuideCard";
import { TipCard } from "../components/education/TipCard";
import { LoadingState, ErrorState, EmptyState } from "../components/ui/StatusStates";
import { BookMarked, GraduationCap, Telescope, Search, X } from "lucide-react";

const LearnPage = () => {
    const [guides, setGuides] = useState<Guide[]>([]);
    const [tip, setTip] = useState<Tip | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");

    const categories = useMemo(() => {
        const extracted = guides.map((g) => g.category).filter(Boolean);
        return Array.from(new Set(["All", ...extracted]));
    }, [guides]);

    const filteredGuides = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return guides.filter((guide) => {
            const matchesCategory =
                selectedCategory === "All" ||
                guide.category?.toLowerCase() === selectedCategory.toLowerCase();

            const matchesSearch =
                !query ||
                guide.title.toLowerCase().includes(query) ||
                guide.description.toLowerCase().includes(query) ||
                (guide.category && guide.category.toLowerCase().includes(query)) ||
                (guide.content && guide.content.toLowerCase().includes(query));

            return matchesCategory && matchesSearch;
        });
    }, [guides, searchQuery, selectedCategory]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Use Promise.allSettled to handle independent failures as per requirements
            const [guidesResult, tipResult] = await Promise.allSettled([
                educationApi.getGuides(),
                educationApi.getTip()
            ]);

            if (guidesResult.status === 'fulfilled') {
                setGuides(guidesResult.value);
            } else {
                const err = normalizeApiError(guidesResult.reason, "Failed to fetch guides");
                console.debug("Failed to fetch guides", { message: err.message, status: err.status, code: err.code });
                // We only set a general error if both or critical one fails, 
                // but requirement says "one failure does not block the other"
            }

            if (tipResult.status === 'fulfilled') {
                setTip(tipResult.value);
            } else {
                const err = normalizeApiError(tipResult.reason, "Failed to fetch tip");
                console.debug("Failed to fetch tip", { message: err.message, status: err.status, code: err.code });
            }

            // If both failed, show error
            if (guidesResult.status === 'rejected' && tipResult.status === 'rejected') {
                setError("Unable to load education content. Please check your connection.");
            }
        } catch (err) {
            const normalized = normalizeApiError(err, "An unexpected error occurred");
            setError(normalized.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 0);
        return () => clearTimeout(timer);
    }, [fetchData]);

    if (loading) {
        return (
            <div className="xelma-grid-bg min-h-screen relative flex items-center justify-center overflow-hidden">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(44,75,253,0.15),_transparent_60%)]" aria-hidden />
                <LoadingState message="Fetching the latest alpha..." className="min-h-[60vh] relative z-10" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="xelma-grid-bg min-h-screen relative flex items-center justify-center px-4 overflow-hidden">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(44,75,253,0.15),_transparent_60%)]" aria-hidden />
                <ErrorState message={error} onRetry={fetchData} className="min-h-[60vh] max-w-lg w-full relative z-10" />
            </div>
        );
    }

    return (
        <div className="xelma-grid-bg min-h-screen relative text-[#F3F4F6] px-4 py-8 lg:py-12">
            {/* Ambient glows */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(44,75,253,0.15),_transparent_60%)]" aria-hidden />
            <div className="pointer-events-none absolute -left-24 top-32 h-80 w-80 rounded-full bg-cyan-500/5 blur-3xl" aria-hidden />
            <div className="pointer-events-none absolute -right-24 top-16 h-96 w-96 rounded-full bg-[#2C4BFD]/8 blur-3xl" aria-hidden />

            <div className="relative mx-auto max-w-7xl">
                <header className="mb-12 text-center">
                    <div className="inline-flex items-center justify-center p-3 mb-4 rounded-2xl bg-xelma-blue/10 border border-xelma-blue/20 text-xelma-teal">
                        <GraduationCap size={32} aria-hidden />
                    </div>
                    <h1 className="hero-headline text-4xl lg:text-5xl font-black mb-4 tracking-tight">
                        Xelma <span className="hero-headline-accent">Academy</span>
                    </h1>
                    <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                        Master the art of prediction. Learn strategies, understand the Stellar ecosystem, and level up your trading game.
                    </p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main Content: Guides */}
                    <div className="lg:col-span-8 space-y-8">
                        <section aria-labelledby="learn-guides-heading">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <BookMarked className="text-xelma-teal shrink-0" size={24} aria-hidden />
                                    <h2 id="learn-guides-heading" className="text-2xl font-bold text-white">
                                        Expert Guides
                                    </h2>
                                </div>

                                {/* Search Input */}
                                {guides.length > 0 && (
                                    <div className="relative w-full sm:w-72">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                            <Search size={16} aria-hidden />
                                        </div>
                                        <input
                                            type="text"
                                            id="guide-search"
                                            aria-label="Search guides"
                                            placeholder="Search guides..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full rounded-xl bg-white/5 border border-white/10 pl-9 pr-8 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-xelma-teal focus:border-transparent transition-all"
                                        />
                                        {searchQuery && (
                                            <button
                                                type="button"
                                                onClick={() => setSearchQuery("")}
                                                aria-label="Clear search"
                                                className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-400 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-xelma-teal rounded-r-xl"
                                            >
                                                <X size={14} aria-hidden />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Category Filter Chips */}
                            {guides.length > 0 && categories.length > 1 && (
                                <div
                                    className="flex flex-wrap gap-2 items-center mb-6"
                                    role="group"
                                    aria-label="Filter guides by category"
                                >
                                    {categories.map((category) => {
                                        const isSelected = selectedCategory.toLowerCase() === category.toLowerCase();
                                        return (
                                            <button
                                                key={category}
                                                type="button"
                                                onClick={() => setSelectedCategory(category)}
                                                aria-pressed={isSelected}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-xelma-teal ${
                                                    isSelected
                                                        ? "bg-xelma-teal text-[#0A0F1A] shadow-sm shadow-xelma-teal/20 font-bold"
                                                        : "bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10"
                                                }`}
                                            >
                                                {category}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {filteredGuides.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {filteredGuides.map((guide) => (
                                        <GuideCard key={guide.id} guide={guide} />
                                    ))}
                                </div>
                            ) : guides.length > 0 ? (
                                <div className="text-center py-12 px-4 rounded-2xl glass-card border border-white/10">
                                    <EmptyState
                                        title="No matching guides found"
                                        message={`No guides match your search query${selectedCategory !== 'All' ? ` or selected category "${selectedCategory}"` : ''}. Try adjusting your filters.`}
                                        icon={<Telescope className="h-12 w-12 text-gray-500 mb-3" />}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchQuery("");
                                            setSelectedCategory("All");
                                        }}
                                        className="mt-4 px-4 py-2 rounded-xl bg-xelma-teal/10 border border-xelma-teal/30 text-xelma-teal hover:bg-xelma-teal/20 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-xelma-teal"
                                    >
                                        Clear Search & Filters
                                    </button>
                                </div>
                            ) : (
                                <EmptyState
                                    title="No guides available"
                                    message="Our experts are currently drafting new content. Check back soon for the latest strategies!"
                                    icon={<Telescope className="h-12 w-12 text-gray-600 mb-4" />}
                                />
                            )}
                        </section>
                    </div>

                    {/* Sidebar: Tip of the day */}
                    <aside className="lg:col-span-4" aria-label="Tips and community">
                        <div className="sticky top-32 space-y-6">
                            <section aria-labelledby="learn-tip-heading">
                                <div className="flex items-center gap-3 mb-6">
                                    <h2 id="learn-tip-heading" className="text-xl font-bold text-white">
                                        Quick Alpha
                                    </h2>
                                </div>

                                {tip ? (
                                    <TipCard tip={tip} />
                                ) : (
                                    <EmptyState
                                        title="No tip today"
                                        message="No specific tip for the moment. Keep your eyes on the chart!"
                                        icon={<BookMarked className="h-8 w-8 text-gray-600 mb-3" />}
                                    />
                                )}
                            </section>

                            {/* Additional info box */}
                            <div className="p-6 rounded-2xl glass-card">
                                <h3 className="font-bold mb-2 text-white">Want to contribute?</h3>
                                <p className="text-sm text-gray-400 mb-4">
                                    Are you an expert in Stellar or prediction markets? Share your knowledge with the community.
                                </p>
                                <button
                                    type="button"
                                    className="btn-ghost w-full py-2.5 px-4 rounded-xl text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xelma-teal focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F1A]"
                                >
                                    Apply as Educator
                                </button>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default LearnPage;
