import * as Dialog from '@radix-ui/react-dialog';

interface EndRoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: {
    isWin: boolean;
    amount: number;
    tip: string;
  };
}

export default function EndRoundModal({ isOpen, onClose, result }: EndRoundModalProps) {
  const { isWin, amount, tip } = result;

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/90 backdrop-blur-md animate-fade-in z-40" />

        <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent">
          <div className="w-full max-w-md animate-scale-in">
            <div className={`relative overflow-hidden rounded-2xl border ${
              isWin ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'
            }`}>
              <div className={`absolute top-0 inset-x-0 h-32 ${
                isWin ? 'bg-emerald-500' : 'bg-rose-500'
              }`}>
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent" />
              </div>

              <div className="relative pt-12 px-8 pb-8 text-center">
                <div
                  className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center text-5xl mb-6 border-4 border-white ${
                    isWin ? 'bg-emerald-400 text-white' : 'bg-rose-400 text-white'
                  }`}
                  aria-hidden
                >
                  {isWin ? '📈' : '📉'}
                </div>

                <Dialog.Title className={`text-3xl font-black  mb-2 tracking-tight ${
                  isWin ? 'text-emerald-900' : 'text-rose-900'
                }`}>
                  {isWin ? 'Spectacular Win!' : 'Tough Break'}
                </Dialog.Title>
                
                <Dialog.Description className={`text-lg font-medium mb-8 ${
                  isWin ? 'text-emerald-800 dark:text-emerald-900' : 'text-rose-800 dark:text-rose-900'
                }`}>
                  {isWin ? 'You made all the right moves.' : 'The market moved against you.'}
                </Dialog.Description>

                <div className="bg-white rounded-xl p-6 border border-gray-100 mb-6">
                  <p className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-2">
                    Net Result
                  </p>
                  <div className={`text-5xl font-black tabular-nums tracking-tighter ${
                    isWin ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {isWin ? '+' : '-'}${Math.abs(amount).toFixed(2)}
                  </div>
                </div>

                <div className={`rounded-lg p-5 mb-8 text-left border ${
                  isWin 
                    ? 'bg-emerald-100/50 border-emerald-200' 
                    : 'bg-rose-100/50 border-rose-200'
                }`}>
                  <div className="flex gap-4">
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        isWin ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'
                      }`}
                      aria-hidden
                    >
                      💡
                    </div>
                    <div>
                      <h4 className={`font-bold text-sm mb-1 ${
                        isWin ? 'text-emerald-900' : 'text-rose-900'
                      }`}>
                        Analyst's Note
                      </h4>
                      <p className={`text-sm leading-relaxed ${
                        isWin ? 'text-emerald-800' : 'text-rose-800'
                      }`}>
                        {tip}
                      </p>
                    </div>
                  </div>
                </div>

                <Dialog.Close asChild>
                  <button
                    type="button"
                    className={`w-full py-4 rounded-xl font-bold text-lg active:scale-95 transition-all outline-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 ${
                      isWin
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white focus-visible:ring-emerald-300 focus-visible:ring-offset-emerald-50'
                        : 'bg-rose-600 hover:bg-rose-500 text-white focus-visible:ring-rose-300 focus-visible:ring-offset-rose-50'
                    }`}
                  >
                    Continue to Next Round
                  </button>
                </Dialog.Close>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
