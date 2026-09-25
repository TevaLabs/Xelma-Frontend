import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
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
    Search: () => <div data-testid="search-icon" />,
    X: () => <div data-testid="x-icon" />,
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

const filterGuides = [
    {
        id: 'g1',
        title: 'How to Predict',
        description: 'A guide to prediction',
        category: 'Strategy',
        readTime: '5 min',
        createdAt: new Date().toISOString(),
    },
    {
        id: 'g2',
        title: 'Chart Reading Basics',
        description: 'Read candles and trends like a pro',
        category: 'Basics',
        readTime: '8 min',
        createdAt: new Date().toISOString(),
    },
    {
        id: 'g3',
        title: 'Stellar Wallets 101',
        description: 'Set up Freighter safely and securely',
        category: 'Wallets',
        readTime: '6 min',
        createdAt: new Date().toISOString(),
    },
    {
        id: 'g4',
        title: 'Risk Management',
        description: 'Manage your position sizing',
        category: 'Strategy',
        readTime: '7 min',
        createdAt: new Date().toISOString(),
    },
];

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

        await waitFor(() => {
            expect(screen.getByText('How to Predict')).toBeInTheDocument();
        });
        expect(screen.getByText(/Always check the chart/i)).toBeInTheDocument();
    });

    it('renders empty states when no content is returned', async () => {
        mockedEducationApi.getGuides.mockResolvedValue([]);
        mockedEducationApi.getTip.mockResolvedValue(null);

        render(<LearnPage />);

        await waitFor(() => {
            expect(screen.getByText(/No guides available/i)).toBeInTheDocument();
        });
        expect(screen.getByText(/No tip today/i)).toBeInTheDocument();
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
        });
        expect(screen.getByText(/No tip today/i)).toBeInTheDocument();
    });
});

describe('LearnPage guide search and category filters', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockedEducationApi.getGuides.mockResolvedValue(filterGuides);
        mockedEducationApi.getTip.mockResolvedValue(null);
    });

    it('renders an accessible search input and category chips derived from guides', async () => {
        render(<LearnPage />);

        const searchInput = await screen.findByRole('searchbox', { name: /search guides/i });
        expect(searchInput).toBeInTheDocument();

        const categoryGroup = screen.getByRole('group', { name: /filter guides by category/i });
        expect(categoryGroup).toBeInTheDocument();

        // Chips are derived from loaded guides: All + unique sorted categories
        expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Basics' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Strategy' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Wallets' })).toBeInTheDocument();

        // Only one chip is active at a time; "All" is the default
        expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByRole('button', { name: 'Basics' })).toHaveAttribute('aria-pressed', 'false');
    });

    it('shows all guides by default and announces the result count', async () => {
        render(<LearnPage />);

        expect(await screen.findByText('How to Predict')).toBeInTheDocument();
        expect(screen.getByText('Chart Reading Basics')).toBeInTheDocument();
        expect(screen.getByText('Stellar Wallets 101')).toBeInTheDocument();
        expect(screen.getByText('Risk Management')).toBeInTheDocument();
        expect(screen.getByText('4 guides match your filters')).toBeInTheDocument();
    });

    it('filters guides by search query across title and description (case-insensitive)', async () => {
        render(<LearnPage />);

        const searchInput = await screen.findByRole('searchbox', { name: /search guides/i });

        // Matches by title, case-insensitively
        fireEvent.change(searchInput, { target: { value: 'stellar' } });

        expect(screen.getByText('Stellar Wallets 101')).toBeInTheDocument();
        expect(screen.queryByText('How to Predict')).toBeNull();
        expect(screen.queryByText('Chart Reading Basics')).toBeNull();
        expect(screen.getByText('1 guide matches your filters')).toBeInTheDocument();

        // Matches by description too
        fireEvent.change(searchInput, { target: { value: 'CANDLES' } });
        expect(screen.getByText('Chart Reading Basics')).toBeInTheDocument();
        expect(screen.queryByText('Stellar Wallets 101')).toBeNull();
    });

    it('filters guides by category when a chip is selected', async () => {
        render(<LearnPage />);

        await screen.findByText('How to Predict');

        fireEvent.click(screen.getByRole('button', { name: 'Strategy' }));

        expect(screen.getByRole('button', { name: 'Strategy' })).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'false');

        expect(screen.getByText('How to Predict')).toBeInTheDocument();
        expect(screen.getByText('Risk Management')).toBeInTheDocument();
        expect(screen.queryByText('Chart Reading Basics')).toBeNull();
        expect(screen.queryByText('Stellar Wallets 101')).toBeNull();
        expect(screen.getByText('2 guides match your filters')).toBeInTheDocument();
    });

    it('combines search query and category filter', async () => {
        render(<LearnPage />);

        await screen.findByText('How to Predict');

        fireEvent.click(screen.getByRole('button', { name: 'Strategy' }));
        fireEvent.change(
            screen.getByRole('searchbox', { name: /search guides/i }),
            { target: { value: 'risk' } },
        );

        expect(screen.getByText('Risk Management')).toBeInTheDocument();
        expect(screen.queryByText('How to Predict')).toBeNull();
        expect(screen.getByText('1 guide matches your filters')).toBeInTheDocument();
    });

    it('shows an empty-match state with a clear action when nothing matches', async () => {
        render(<LearnPage />);

        const searchInput = await screen.findByRole('searchbox', { name: /search guides/i });
        fireEvent.change(searchInput, { target: { value: 'nonexistent-topic' } });

        expect(screen.getByText('No guides match your filters')).toBeInTheDocument();
        expect(
            screen.getByText(/Try different keywords or clear your filters/i),
        ).toBeInTheDocument();
        expect(screen.getByText('0 guides match your filters')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument();
    });

    it('restores the unfiltered list when the clear action is used', async () => {
        render(<LearnPage />);

        await screen.findByText('How to Predict');

        // Apply both filters first
        fireEvent.click(screen.getByRole('button', { name: 'Wallets' }));
        fireEvent.change(
            screen.getByRole('searchbox', { name: /search guides/i }),
            { target: { value: 'nomatch' } },
        );
        expect(screen.getByText('No guides match your filters')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /clear filters/i }));

        // Search box and category selection are reset
        expect(screen.getByRole('searchbox', { name: /search guides/i })).toHaveValue('');
        expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');

        // All guides are visible again
        expect(screen.getByText('How to Predict')).toBeInTheDocument();
        expect(screen.getByText('Chart Reading Basics')).toBeInTheDocument();
        expect(screen.getByText('Stellar Wallets 101')).toBeInTheDocument();
        expect(screen.getByText('Risk Management')).toBeInTheDocument();
        expect(screen.getByText('4 guides match your filters')).toBeInTheDocument();
    });

    it('filters purely client-side without extra network round-trips', async () => {
        render(<LearnPage />);

        await screen.findByText('How to Predict');
        const callCount = mockedEducationApi.getGuides.mock.calls.length;

        fireEvent.change(
            screen.getByRole('searchbox', { name: /search guides/i }),
            { target: { value: 'stellar' } },
        );
        fireEvent.click(screen.getByRole('button', { name: 'Wallets' }));

        expect(screen.getByText('Stellar Wallets 101')).toBeInTheDocument();
        // No additional fetches were triggered by filtering
        expect(mockedEducationApi.getGuides.mock.calls.length).toBe(callCount);
    });

    it('keeps filter controls keyboard accessible as native focusable elements', async () => {
        render(<LearnPage />);

        await screen.findByText('How to Predict');

        const searchInput = screen.getByRole('searchbox', { name: /search guides/i });
        const basicsChip = screen.getByRole('button', { name: 'Basics' });

        // Native input/button elements are reachable via keyboard focus
        searchInput.focus();
        expect(document.activeElement).toBe(searchInput);

        basicsChip.focus();
        expect(document.activeElement).toBe(basicsChip);

        // Activating the focused chip via keyboard (Enter) toggles the filter
        fireEvent.keyDown(basicsChip, { key: 'Enter', code: 'Enter' });
        fireEvent.click(basicsChip);
        expect(basicsChip).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByText('Chart Reading Basics')).toBeInTheDocument();
    });
});
