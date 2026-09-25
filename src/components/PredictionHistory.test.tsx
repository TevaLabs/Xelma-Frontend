import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import PredictionHistory from "./PredictionHistory";
import { predictionsApi, type UserPrediction } from "../lib/api-client";

// Mock the API client
vi.mock("../lib/api-client", () => ({
  predictionsApi: {
    getUserHistory: vi.fn(),
  },
}));

describe("PredictionHistory", () => {
  const mockUserId = "test-user-123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders connect wallet message when no userId is provided", () => {
    render(<PredictionHistory userId={null} />);
    expect(screen.getByText("Connect your wallet")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Export CSV/i })).not.toBeInTheDocument();
  });

  it("disables export button when prediction history is empty", async () => {
    (predictionsApi.getUserHistory as Mock).mockResolvedValue([]);

    render(<PredictionHistory userId={mockUserId} />);

    // Wait for the history loading to finish and show empty state
    await waitFor(() => {
      expect(screen.getByText("No predictions yet")).toBeInTheDocument();
    });

    const exportBtn = screen.getByRole("button", { name: /Export CSV/i });
    expect(exportBtn).toBeInTheDocument();
    expect(exportBtn).toBeDisabled();
  });

  it("enables export button when prediction history is loaded", async () => {
    const mockHistory: UserPrediction[] = [
      {
        id: "1",
        direction: "UP",
        stake: 10,
        status: "WON",
        createdAt: "2026-07-29T10:00:00.000Z",
      },
    ];
    (predictionsApi.getUserHistory as Mock).mockResolvedValue(mockHistory);

    render(<PredictionHistory userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText(/WON/i)).toBeInTheDocument();
    });

    const exportBtn = screen.getByRole("button", { name: /Export CSV/i });
    expect(exportBtn).toBeInTheDocument();
    expect(exportBtn).not.toBeDisabled();
  });

  it("triggers file download with correct CSV content on export click", async () => {
    const mockHistory: UserPrediction[] = [
      {
        id: "1",
        asset: "BTC",
        direction: "UP",
        stake: 10.5,
        status: "WON",
        createdAt: "2026-07-29T10:00:00.000Z",
      },
      {
        id: "2",
        asset: "XLM",
        direction: "DOWN",
        stake: "20",
        status: "LOST",
        createdAt: "2026-07-29T10:05:00.000Z",
      },
    ];
    (predictionsApi.getUserHistory as Mock).mockResolvedValue(mockHistory);

    // Mock global URL methods
    const createObjectURLMock = vi.fn().mockReturnValue("blob:mock-url");
    const revokeObjectURLMock = vi.fn();
    global.URL.createObjectURL = createObjectURLMock;
    global.URL.revokeObjectURL = revokeObjectURLMock;

    // Spy on DOM methods used for download, leaving original implementations intact
    const appendChildSpy = vi.spyOn(document.body, "appendChild");
    const removeChildSpy = vi.spyOn(document.body, "removeChild");
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    // Spy on Blob constructor to assert CSV content
    const blobSpy = vi.spyOn(global, "Blob");

    render(<PredictionHistory userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText(/WON/i)).toBeInTheDocument();
    });

    const exportBtn = screen.getByRole("button", { name: /Export CSV/i });
    // The object URL is revoked after a short delay (not in the same tick).
    vi.useFakeTimers({ toFake: ["setTimeout"] });
    fireEvent.click(exportBtn);

    // Assert URL.createObjectURL and Blob creation
    expect(blobSpy).toHaveBeenCalled();
    const blobArgs = blobSpy.mock.calls[0][0] as string[];
    const expectedCSV = [
      "asset,direction,stake,result,timestamp",
      "BTC,UP,10.5,WON,2026-07-29T10:00:00.000Z",
      "XLM,DOWN,20,LOST,2026-07-29T10:05:00.000Z",
    ].join("\n");
    expect(blobArgs[0]).toBe(expectedCSV);

    expect(createObjectURLMock).toHaveBeenCalled();
    expect(appendChildSpy).toHaveBeenCalled();
    
    // Find the call for the anchor element
    const anchorCall = appendChildSpy.mock.calls.find(call => call[0] instanceof HTMLAnchorElement);
    expect(anchorCall).toBeDefined();
    const mockAnchor = anchorCall![0] as HTMLAnchorElement;
    expect(mockAnchor.tagName).toBe("A");
    expect(mockAnchor.getAttribute("href")).toBe("blob:mock-url");
    expect(mockAnchor.getAttribute("download")).toBe(`prediction_history_${mockUserId}.csv`);
    
    expect(clickSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalledWith(mockAnchor);
    expect(revokeObjectURLMock).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:mock-url");
    vi.useRealTimers();

    // Clean up spies
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
    clickSpy.mockRestore();
    blobSpy.mockRestore();
  });

  describe("export availability", () => {
    it("says why export is disabled when the history is empty", async () => {
      (predictionsApi.getUserHistory as Mock).mockResolvedValue([]);

      render(<PredictionHistory userId={mockUserId} />);
      await waitFor(() => {
        expect(screen.getByText("No predictions yet")).toBeInTheDocument();
      });

      const exportBtn = screen.getByRole("button", { name: /Export CSV/i });
      expect(exportBtn).toBeDisabled();
      expect(exportBtn).toHaveAccessibleDescription("No predictions to export yet");
      expect(exportBtn.closest("span[title]")).toHaveAttribute("title", "No predictions to export yet");
    });

    it("says export is unavailable while the history is loading", () => {
      (predictionsApi.getUserHistory as Mock).mockReturnValue(new Promise(() => {}));

      render(<PredictionHistory userId={mockUserId} />);

      const exportBtn = screen.getByRole("button", { name: /Export CSV/i });
      expect(exportBtn).toBeDisabled();
      expect(exportBtn).toHaveAccessibleDescription("Export unavailable while your history is loading");
    });

    it("shows no reason once there is something to export", async () => {
      (predictionsApi.getUserHistory as Mock).mockResolvedValue([
        { id: "1", direction: "UP", stake: 10, status: "WON", createdAt: "2026-07-29T10:00:00.000Z" },
      ]);

      render(<PredictionHistory userId={mockUserId} />);
      await waitFor(() => {
        expect(screen.getByText(/WON/i)).toBeInTheDocument();
      });

      const exportBtn = screen.getByRole("button", { name: /Export CSV/i });
      expect(exportBtn).toBeEnabled();
      expect(exportBtn).not.toHaveAttribute("aria-describedby");
      expect(exportBtn.closest("span[title]")).toBeNull();
    });

    it("exports the whole history, not just the rows visible on the first page", async () => {
      const many: UserPrediction[] = Array.from({ length: 25 }, (_, i) => ({
        id: String(i + 1),
        asset: "XLM",
        direction: i % 2 === 0 ? "UP" : "DOWN",
        stake: i + 1,
        status: "WON",
        createdAt: "2026-07-29T10:00:00.000Z",
      }));
      (predictionsApi.getUserHistory as Mock).mockResolvedValue(many);
      global.URL.createObjectURL = vi.fn().mockReturnValue("blob:mock-url");
      global.URL.revokeObjectURL = vi.fn();
      const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
      const blobSpy = vi.spyOn(global, "Blob");

      render(<PredictionHistory userId={mockUserId} />);
      await waitFor(() => {
        expect(screen.getAllByText(/WON/i).length).toBeGreaterThan(0);
      });
      // Only the first page is on screen...
      expect(screen.getByRole("button", { name: /Load more/i })).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /Export CSV/i }));

      // ...but the file has the header plus all 25 predictions.
      const csv = (blobSpy.mock.calls[0][0] as string[])[0];
      expect(csv.split("\n")).toHaveLength(26);

      clickSpy.mockRestore();
      blobSpy.mockRestore();
    });
  });

  describe("optimistic pending prediction", () => {
    it("shows the pending row and badge immediately, before any history has loaded", async () => {
      // getUserHistory intentionally never resolves in this test — the pending
      // row must appear from optimisticPrediction alone, not from a fetch.
      (predictionsApi.getUserHistory as Mock).mockReturnValue(new Promise(() => {}));

      const pending: UserPrediction = {
        id: "pending-123",
        direction: "UP",
        stake: "10",
        status: "PENDING",
        createdAt: "2026-08-25T10:00:00.000Z",
      };

      render(<PredictionHistory userId={mockUserId} optimisticPrediction={pending} />);

      expect(screen.getByTestId("prediction-pending-badge")).toBeInTheDocument();
      expect(screen.getByText(/Stake: 10/i)).toBeInTheDocument();
    });

    it("lists the pending row ahead of already-loaded history items", async () => {
      const mockHistory: UserPrediction[] = [
        { id: "1", direction: "UP", stake: 10, status: "WON", createdAt: "2026-07-29T10:00:00.000Z" },
      ];
      (predictionsApi.getUserHistory as Mock).mockResolvedValue(mockHistory);

      const pending: UserPrediction = {
        id: "pending-456",
        direction: "DOWN",
        stake: "5",
        status: "PENDING",
        createdAt: "2026-08-25T10:00:00.000Z",
      };

      render(<PredictionHistory userId={mockUserId} optimisticPrediction={pending} />);

      await waitFor(() => {
        expect(screen.getByText(/WON/i)).toBeInTheDocument();
      });

      const items = screen.getAllByRole("listitem");
      expect(items).toHaveLength(2);
      expect(items[0]).toHaveTextContent("Pending");
      expect(items[1]).toHaveTextContent("WON");
    });

    it("does not duplicate a row once the optimistic id matches a real history entry", async () => {
      const mockHistory: UserPrediction[] = [
        { id: "pending-789", direction: "UP", stake: 10, status: "WON", createdAt: "2026-07-29T10:00:00.000Z" },
      ];
      (predictionsApi.getUserHistory as Mock).mockResolvedValue(mockHistory);

      const pending: UserPrediction = {
        id: "pending-789",
        direction: "UP",
        stake: "10",
        status: "PENDING",
        createdAt: "2026-08-25T10:00:00.000Z",
      };

      render(<PredictionHistory userId={mockUserId} optimisticPrediction={pending} />);

      await waitFor(() => {
        expect(screen.getAllByRole("listitem")).toHaveLength(1);
      });
    });

    it("shows the failed badge when the optimistic prediction's status is FAILED", async () => {
      (predictionsApi.getUserHistory as Mock).mockResolvedValue([]);

      const failed: UserPrediction = {
        id: "pending-999",
        direction: "UP",
        stake: "10",
        status: "FAILED",
        createdAt: "2026-08-25T10:00:00.000Z",
      };

      render(<PredictionHistory userId={mockUserId} optimisticPrediction={failed} />);

      expect(screen.getByTestId("prediction-failed-badge")).toBeInTheDocument();
      expect(screen.queryByTestId("prediction-pending-badge")).not.toBeInTheDocument();

      // Let the underlying history fetch settle so it doesn't leak into other tests.
      await waitFor(() => {
        expect(predictionsApi.getUserHistory).toHaveBeenCalled();
      });
    });

    it("re-fetches history when refreshSignal changes, so a confirmed prediction replaces the cleared optimistic row", async () => {
      (predictionsApi.getUserHistory as Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { id: "1", direction: "UP", stake: 10, status: "WON", createdAt: "2026-07-29T10:00:00.000Z" },
        ]);

      const { rerender } = render(
        <PredictionHistory userId={mockUserId} optimisticPrediction={null} refreshSignal={0} />
      );

      await waitFor(() => {
        expect(predictionsApi.getUserHistory).toHaveBeenCalledTimes(1);
      });

      rerender(<PredictionHistory userId={mockUserId} optimisticPrediction={null} refreshSignal={1} />);

      await waitFor(() => {
        expect(predictionsApi.getUserHistory).toHaveBeenCalledTimes(2);
      });

      await waitFor(() => {
        expect(screen.getByText(/WON/i)).toBeInTheDocument();
      });
    });
  });
});
