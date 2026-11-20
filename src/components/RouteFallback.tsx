const RouteFallback = () => (
  <div className="xelma-grid-bg min-h-screen flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div
        className="h-10 w-10 rounded-full border-2 border-[#2C4BFD] border-t-transparent motion-safe:animate-spin"
        role="status"
        aria-label="Loading page"
        aria-busy="true"
      />
      <p className="text-sm font-medium text-gray-500 tracking-wide">Loading…</p>
    </div>
  </div>
);

export default RouteFallback;
