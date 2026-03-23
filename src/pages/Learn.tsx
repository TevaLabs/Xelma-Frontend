import { useEffect, useState, useCallback } from "react";
import { educationApi } from "../lib/api-client";
import { getErrorMessage } from "../lib/api";
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
                console.error("Failed to fetch guides:", guidesResult.reason);
                // We only set a general error if both or critical one fails, 
                // but requirement says "one failure does not block the other"
            }

            if (tipResult.status === 'fulfilled') {
                setTip(tipResult.value);
            } else {
                console.error("Failed to fetch tip:", tipResult.reason);
            }

            // If both failed, show error
            if (guidesResult.status === 'rejected' && tipResult.status === 'rejected') {
                setError("Unable to load education content. Please check your connection.");
            }
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-12">
                <LoadingState message="Fetching the latest alpha..." className="min-h-[60vh]" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-12">
                <ErrorState message={error} onRetry={fetchData} className="min-h-[60vh]" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 lg:py-12 max-w-7xl animate-in fade-in duration-700">
            <header className="mb-12 text-center">
                <div className="inline-flex items-center justify-center p-3 mb-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-[#2C4BFD]">
                    <GraduationCap size={32} />
                </div>
                <h1 className="text-4xl lg:text-5xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                    Xelma Academy
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                    Master the art of prediction. Learn strategies, understand the Stellar ecosystem, and level up your trading game.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Content: Guides */}
                <div className="lg:col-span-8 space-y-8">
                    <section>
                        <div className="flex items-center gap-3 mb-8">
                            <BookMarked className="text-[#2C4BFD]" size={24} />
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Expert Guides</h2>
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
                                icon={<Telescope className="h-12 w-12 text-gray-300 dark:text-gray-700 mb-4" />}
                                className="bg-gray-50 dark:bg-gray-900/50"
                            />
                        )}
                    </section>
                </div>

                {/* Sidebar: Tip of the day */}
                <aside className="lg:col-span-4">
                    <div className="sticky top-32 space-y-6">
                        <section>
                            <div className="flex items-center gap-3 mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Quick Alpha</h2>
                            </div>

                            {tip ? (
                                <TipCard tip={tip} />
                            ) : (
                                <EmptyState
                                    title="No tip today"
                                    message="No specific tip for the moment. Keep your eyes on the chart!"
                                    className="bg-blue-50/50 dark:bg-blue-900/5 py-8"
                                    icon={<BookMarked className="h-8 w-8 text-blue-200 dark:text-blue-900/20 mb-3" />}
                                />
                            )}
                        </section>

                        {/* Additional info box */}
                        <div className="p-6 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                            <h3 className="font-bold mb-2">Want to contribute?</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                Are you an expert in Stellar or prediction markets? Share your knowledge with the community.
                            </p>
                            <button className="w-full py-2 px-4 rounded-xl text-sm font-bold border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                Apply as Educator
                            </button>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default LearnPage;
