const en = {
  navbar: {
    nav: {
      terminal: 'Terminal',
      pools: 'Pools',
      leaderboard: 'Leaderboard',
      learn: 'Learn',
      profile: 'Profile',
    },
    connectWallet: 'Connect Wallet',
    connected: 'Connected',
    connecting: 'Connecting…',
    menu: 'Menu',
    openMobileMenu: 'Open mobile menu',
    closeMenu: 'Close menu',
    balance: 'Balance',
    address: 'Address',
    networkMainnet: 'Mainnet',
    networkTestnet: 'Testnet',
    stellarNetwork: 'Stellar network: {{network}}',
    languageLabel: 'Language',
    mobileNavigationMenu: 'Mobile navigation menu',
  },
  landing: {
    badge: 'Stellar prediction infrastructure',
    headline1: 'Read the market.',
    headline2: 'Prove your call.',
    subtitle:
      'Xelma is a trustless, dual-mode prediction market on Stellar — where collective intelligence meets on-chain settlement. Practice with virtual XLM. No deposit required.',
    enterTerminal: 'Enter Prediction Terminal',
    howItWorks: 'How It Works',
    starterNote: 'New accounts start with 1,000 practice vXLM on Stellar testnet.',
    cachedMetrics: 'Showing cached metrics',
    cachedMetricsDescription: 'Live metrics are temporarily unavailable. Showing the latest known figures.',
    roundsResolved: 'Rounds Resolved',
    practiceVolume: 'Practice Volume',
    activePredictors: 'Active Predictors',
  },
  footer: {
    description: 'Collective market intelligence on Stellar',
  },
  dashboard: {
    refresh: 'Refresh',
    walletPrompt: {
      message: 'Connect your wallet to submit predictions.',
      connectNow: 'Connect now',
    },
    emptyState: {
      noActiveRounds: {
        title: 'No Active Rounds',
        description: 'Learn how the game works or refresh to check for new rounds.',
      },
      noAssetRounds: {
        title: 'No {{asset}} Rounds Available',
        description:
          'There are currently no active rounds for {{assetName}}. Try selecting a different asset or check back later.',
      },
    },
    sorobanInspector: {
      title: 'Soroban Inspector',
      description: 'Read-only wallet position and round state.',
      loading: 'Loading…',
      rpcFallback: 'RPC fallback: {{error}}',
    },
    share: {
      button: 'Share',
      copyAriaLabel: 'Copy share link',
      copied: 'Link copied to clipboard',
      copyError: 'Could not copy link',
    },
    assetNames: {
      BTC: 'Bitcoin',
      ETH: 'Ethereum',
      XLM: 'Stellar',
    },
  },
  testFallback: 'Fallback test',
};

export default en;
