import { useEffect, useState, useCallback } from "react";
import { educationApi } from "../lib/api-client";
import { normalizeApiError } from "../lib/api";
import type { Guide, Tip } from "../types/education";
import { GuideCard } from "../components/education/GuideCard";
import { TipCard } from "../components/education/TipCard";
import { LoadingState, ErrorState, EmptyState } from "../components/ui/StatusStates";
import { BookMarked, GraduationCap, Telescope } from "lucide-react";

const LearnPage = () => {
    const [guides, setGuides] = useState<Guide[]>([]);
    const [tip, setTip] = useState<Tip | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
        fetchData();
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
                            <div className="flex items-center gap-3 mb-8">
                                <BookMarked className="text-xelma-teal shrink-0" size={24} aria-hidden />
                                <h2 id="learn-guides-heading" className="text-2xl font-bold text-white">
                                    Expert Guides
                                </h2>
                            </div>

                            {guides.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {guides.map((guide) => (
                                        <GuideCard key={guide.id} guide={guide} />
                                    ))}
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
