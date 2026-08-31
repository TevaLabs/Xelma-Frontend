const es = {
  navbar: {
    nav: {
      terminal: 'Terminal',
      pools: 'Pools',
      leaderboard: 'Clasificación',
      learn: 'Aprender',
      profile: 'Perfil',
    },
    connectWallet: 'Conectar cartera',
    connected: 'Conectado',
    connecting: 'Conectando…',
    menu: 'Menú',
    openMobileMenu: 'Abrir menú móvil',
    closeMenu: 'Cerrar menú',
    balance: 'Saldo',
    address: 'Dirección',
    networkMainnet: 'Red principal',
    networkTestnet: 'Red de prueba',
    stellarNetwork: 'Red Stellar: {{network}}',
    languageLabel: 'Idioma',
    mobileNavigationMenu: 'Menú de navegación móvil',
  },
  landing: {
    badge: 'Infraestructura de predicción Stellar',
    headline1: 'Lee el mercado.',
    headline2: 'Demuestra tu llamada.',
    subtitle:
      'Xelma es un mercado de predicción sin confianza y de doble modo en Stellar — donde la inteligencia colectiva se encuentra con la liquidación on-chain. Practica con XLM virtual. No se requiere depósito.',
    enterTerminal: 'Entrar a la terminal de predicción',
    howItWorks: 'Cómo funciona',
    starterNote: 'Las cuentas nuevas comienzan con 1,000 vXLM de práctica en la red de prueba de Stellar.',
    cachedMetrics: 'Mostrando métricas en caché',
    cachedMetricsDescription: 'Las métricas en vivo no están disponibles temporalmente. Mostrando las cifras conocidas más recientes.',
    roundsResolved: 'Rondas resueltas',
    practiceVolume: 'Volumen de práctica',
    activePredictors: 'Predictores activos',
    howItWorksSection: {
      title: 'Cómo funciona',
      subtitle: 'Comienza a predecir tendencias del mercado en Stellar en tres sencillos pasos.',
      step1: {
        stepNumber: '01',
        title: 'Conectar Freighter',
        description: 'Vincular tu cartera Stellar Freighter para acceder a predicciones en la red de prueba de forma segura.'
      },
      step2: {
        stepNumber: '02',
        title: 'Practicar vXLM',
        description: 'Recibe 1,000 vXLM de práctica automáticamente para explorar predicciones sin riesgo.'
      },
      step3: {
        stepNumber: '03',
        title: 'Enviar predicción',
        description: 'Elige el modo Direccional o de Precisión y asegura tu pronóstico de precio en la cadena.'
      }
    },
  },
  footer: {
    description: 'Inteligencia colectiva de mercado en Stellar',
  },
  dashboard: {
    refresh: 'Actualizar',
    walletPrompt: {
      message: 'Conecta tu cartera para enviar predicciones.',
      connectNow: 'Conectar ahora',
    },
    emptyState: {
      noActiveRounds: {
        title: 'No hay rondas activas',
        description: 'Aprende cómo funciona el juego o actualiza para ver rondas nuevas.',
      },
      noAssetRounds: {
        title: 'No hay rondas de {{asset}} disponibles',
        description:
          'Actualmente no hay rondas activas para {{assetName}}. Prueba a seleccionar otro activo o vuelve más tarde.',
      },
    },
    sorobanInspector: {
      title: 'Inspector Soroban',
      description: 'Posición de la cartera y estado de la ronda, solo lectura.',
      loading: 'Cargando…',
      rpcFallback: 'Respaldo RPC: {{error}}',
    },
    share: {
      button: 'Compartir',
      copyAriaLabel: 'Copiar enlace para compartir',
      copied: 'Enlace copiado al portapapeles',
      copyError: 'No se pudo copiar el enlace',
    },
    assetNames: {
      BTC: 'Bitcoin',
      ETH: 'Ethereum',
      XLM: 'Stellar',
    },
  },
};

export default es;
