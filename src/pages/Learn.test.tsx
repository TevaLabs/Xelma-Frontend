import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LearnPage from './Learn';
import { educationApi } from '../lib/api-client';

// Mock the API client
vi.mock('../lib/api-client', () => ({
    educationApi: {
        getGuides: vi.fn(),
        getTip: vi.fn(),
    },
}));

const mockedEducationApi = vi.mocked(educationApi);

// Mock Lucide icons as they can be problematic in JSDOM
vi.mock('lucide-react', () => ({
    BookOpen: () => <div data-testid="book-icon" />,
    Clock: () => <div data-testid="clock-icon" />,
    ChevronRight: () => <div data-testid="chevron-icon" />,
    Lightbulb: () => <div data-testid="bulb-icon" />,
    Sparkles: () => <div data-testid="sparkles-icon" />,
    Loader2: () => <div data-testid="loader-icon" />,
    AlertCircle: () => <div data-testid="alert-icon" />,
    Inbox: () => <div data-testid="inbox-icon" />,
    RefreshCw: () => <div data-testid="refresh-icon" />,
    BookMarked: () => <div data-testid="bookmarked-icon" />,
    GraduationCap: () => <div data-testid="grad-icon" />,
    Telescope: () => <div data-testid="telescope-icon" />,
}));

const mockGuides = [
    {
        id: '1',
        title: 'How to Predict',
        description: 'A guide to prediction',
        category: 'Stratery',
        readTime: '5 min',
        createdAt: new Date().toISOString(),
    },
];

const mockTip = {
    id: '1',
    content: 'Always check the chart',
    title: 'Pro Tip',
    createdAt: new Date().toISOString(),
};

describe('LearnPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading state initially', async () => {
        mockedEducationApi.getGuides.mockReturnValue(new Promise(() => { }));
        mockedEducationApi.getTip.mockReturnValue(new Promise(() => { }));

        render(<LearnPage />);
        expect(screen.getByText(/Fetching the latest alpha/i)).toBeInTheDocument();
    });

    it('renders guides and tip on success', async () => {
        mockedEducationApi.getGuides.mockResolvedValue(mockGuides);
        mockedEducationApi.getTip.mockResolvedValue(mockTip);

        render(<LearnPage />);

        // Explicitly flush async effects and resulting state updates.
        // React 19's act environment can intercept waitFor's retry timers when the
        // scheduler has lingering work from the previous test's eternal promises.
        // Awaiting act() yields to the microtask queue so the mocked Promise.allSettled
        // chain resolves and setGuides/setTip/setLoading(false) are applied before
        // we assert synchronously.
        await act(async () => {});

        expect(screen.getByText('How to Predict')).toBeInTheDocument();
        expect(screen.getByText(/Always check the chart/i)).toBeInTheDocument();
    });

    it('renders empty states when no content is returned', async () => {
        mockedEducationApi.getGuides.mockResolvedValue([]);
        mockedEducationApi.getTip.mockResolvedValue(null);

        render(<LearnPage />);

        await waitFor(() => {
            expect(screen.getByText(/No guides available/i)).toBeInTheDocument();
            expect(screen.getByText(/No tip today/i)).toBeInTheDocument();
        });
    });

    it('renders error state when both requests fail', async () => {
        mockedEducationApi.getGuides.mockRejectedValue(new Error('Guides failed'));
        mockedEducationApi.getTip.mockRejectedValue(new Error('Tip failed'));

        render(<LearnPage />);

        await waitFor(() => {
            expect(screen.getByText(/Unable to load education content/i)).toBeInTheDocument();
        });
    });

    it('renders partial content when only one request fails', async () => {
        mockedEducationApi.getGuides.mockResolvedValue(mockGuides);
        mockedEducationApi.getTip.mockRejectedValue(new Error('Tip failed'));

        render(<LearnPage />);

        await waitFor(() => {
            expect(screen.getByText('How to Predict')).toBeInTheDocument();
            expect(screen.getByText(/No tip today/i)).toBeInTheDocument();
        });
    });
});
