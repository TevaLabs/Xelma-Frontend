import { useMemo } from 'react';
import Avatar from '../assets/avatar.svg';

interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string;
  xlm: number;
}

const MOCK_USERS: LeaderboardUser[] = [
  { id: "1", name: "devtochukwu", avatar: Avatar, xlm: 12500.5 },
  { id: "2", name: "CryptoKing", avatar: Avatar, xlm: 11200.0 },
  { id: "3", name: "StellarQueen", avatar: Avatar, xlm: 10850.75 },
  { id: "4", name: "MoonWalker", avatar: Avatar, xlm: 9500.2 },
  { id: "5", name: "HodlGang", avatar: Avatar, xlm: 8200.1 },
  { id: "6", name: "ToTheMoon", avatar: Avatar, xlm: 7600.0 },
  { id: "7", name: "DiamondHands", avatar: Avatar, xlm: 6400.5 },
  { id: "8", name: "RocketMan", avatar: Avatar, xlm: 5100.25 },
  { id: "9", name: "SatoshiFan", avatar: Avatar, xlm: 4300.0 },
  { id: "10", name: "BlockchainBro", avatar: Avatar, xlm: 3200.1 },
];

const Leaderboard = () => {
  // Sort users by XLM descending (just to be safe, though mock data is sorted)
  const sortedUsers = useMemo(() => {
    return [...MOCK_USERS].sort((a, b) => b.xlm - a.xlm);
  }, []);

  const topThree = sortedUsers.slice(0, 3);
  const restUsers = sortedUsers.slice(3);

  // Podium positions: Rank 2 (left), Rank 1 (center), Rank 3 (right)
  // We'll map them manually to control layout easily
  const rank1 = topThree[0];
  const rank2 = topThree[1];
  const rank3 = topThree[2];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-12 pt-8">
      <h1 className="text-3xl font-bold text-[#292D32] dark:text-white text-center mb-16 tracking-tight">
        Leaderboard
      </h1>

      {/* Podium Section */}
      <div className="flex flex-col md:flex-row items-end justify-center gap-6 mb-16 mt-24">
        {/* Rank 2 (Silver) */}
        {rank2 && (
          <div className="order-2 md:order-1 flex flex-col items-center w-full md:w-1/3 group">
            <div className="relative mb-4 transition-transform duration-300 md:group-hover:-translate-y-2">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#C0C0C0] shadow-[0_0_20px_rgba(192,192,192,0.4)] z-10 relative bg-white dark:bg-gray-800">
                <img
                  src={rank2.avatar}
                  alt={rank2.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-linear-to-r from-[#C0C0C0] to-[#E0E0E0] text-gray-800 text-sm font-bold py-1 px-3 rounded-full shadow-md z-20 whitespace-nowrap min-w-[32px] text-center border-2 border-white dark:border-gray-900">
                #2
              </div>
            </div>
            <p className="font-bold text-[#292D32] dark:text-white text-lg mb-1">
              {rank2.name}
            </p>
            <p className="text-[#C0C0C0] font-bold text-base bg-[#C0C0C0]/10 px-3 py-1 rounded-full">
              {rank2.xlm.toLocaleString()} XLM
            </p>
            <div className="w-full h-24 bg-linear-to-t from-[#C0C0C0]/20 to-transparent rounded-t-2xl mt-4 hidden md:block"></div>
          </div>
        )}

        {/* Rank 1 (Gold) */}
        {rank1 && (
          <div className="order-1 md:order-2 flex flex-col items-center w-full md:w-1/3 -mt-6 md:-mt-12 z-10 group">
            <div className="relative mb-5 transition-transform duration-300 md:group-hover:-translate-y-2">
              <div className="w-32 h-32 rounded-full overflow-hidden border-[5px] border-[#FFD700] shadow-[0_0_30px_rgba(255,215,0,0.5)] z-10 relative bg-white dark:bg-gray-800 ring-2 ring-[#FFD700]/50 ring-offset-2 dark:ring-offset-gray-900">
                <img
                  src={rank1.avatar}
                  alt={rank1.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-linear-to-r from-[#FFD700] to-[#FDB931] text-gray-900 text-base font-extrabold py-1.5 px-4 rounded-full shadow-lg z-20 whitespace-nowrap min-w-[40px] text-center border-2 border-white dark:border-gray-900">
                #1
              </div>
              {/* Crown Icon or Glow */}
              <div
                className="absolute -top-8 left-1/2 -translate-x-1/2 text-4xl animate-bounce drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]"
                aria-hidden="true"
              >
                👑
              </div>
            </div>
            <p className="font-bold text-[#292D32] dark:text-white text-2xl mb-1">
              {rank1.name}
            </p>
            <p className="text-[#FDB931] font-extrabold text-xl bg-[#FFD700]/10 px-4 py-1.5 rounded-full shadow-sm shadow-[#FFD700]/10">
              {rank1.xlm.toLocaleString()} XLM
            </p>
            <div className="w-full h-40 bg-linear-to-t from-[#FFD700]/25 to-transparent rounded-t-2xl mt-4 hidden md:block"></div>
          </div>
        )}

        {/* Rank 3 (Bronze) */}
        {rank3 && (
          <div className="order-3 md:order-3 flex flex-col items-center w-full md:w-1/3 group">
            <div className="relative mb-4 transition-transform duration-300 md:group-hover:-translate-y-2">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#CD7F32] shadow-[0_0_20px_rgba(205,127,50,0.4)] z-10 relative bg-white dark:bg-gray-800">
                <img
                  src={rank3.avatar}
                  alt={rank3.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-linear-to-r from-[#CD7F32] to-[#B87333] text-white text-sm font-bold py-1 px-3 rounded-full shadow-md z-20 whitespace-nowrap min-w-[32px] text-center border-2 border-white dark:border-gray-900">
                #3
              </div>
            </div>
            <p className="font-bold text-[#292D32] dark:text-white text-lg mb-1">
              {rank3.name}
            </p>
            <p className="text-[#CD7F32] font-bold text-base bg-[#CD7F32]/10 px-3 py-1 rounded-full">
              {rank3.xlm.toLocaleString()} XLM
            </p>
            <div className="w-full h-20 bg-linear-to-t from-[#CD7F32]/20 to-transparent rounded-t-2xl mt-4 hidden md:block"></div>
          </div>
        )}
      </div>

      {/* Ranked List */}
      <ul className="space-y-4 max-w-3xl mx-auto">
        {restUsers.map((user, index) => (
          <li
            key={user.id}
            className="flex flex-col items-center gap-3 md:flex-row md:justify-between md:gap-0 bg-white dark:bg-gray-800/50 backdrop-blur-sm border border-gray-100 dark:border-gray-700/50 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-[#2C4BFD]/30 dark:hover:border-[#2C4BFD]/50 transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-6 w-full justify-center md:justify-start">
              <span className="text-gray-400 dark:text-gray-500 font-bold text-lg w-8 text-center tabular-nums">
                {index + 4}
              </span>
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 border-2 border-transparent group-hover:border-[#2C4BFD]/20">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-bold text-[#292D32] dark:text-gray-200 text-lg">
                {user.name}
              </span>
            </div>
            <div className="text-center md:text-right w-full md:w-auto mt-2 md:mt-0 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-xl">
              <span className="font-bold text-[#2C4BFD] text-lg tabular-nums">
                {user.xlm.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-blue-400 ml-1.5 uppercase tracking-wider">
                XLM
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Leaderboard;
