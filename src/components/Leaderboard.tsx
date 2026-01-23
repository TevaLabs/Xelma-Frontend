import { useMemo } from "react";
import Avatar from "../assets/avatar.svg";

interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string;
  xlm: number;
}

const MOCK_USERS: LeaderboardUser[] = [
  { id: "1", name: "Joedev", avatar: Avatar, xlm: 12500.50 },
  { id: "2", name: "CryptoKing", avatar: Avatar, xlm: 11200.00 },
  { id: "3", name: "StellarQueen", avatar: Avatar, xlm: 10850.75 },
  { id: "4", name: "MoonWalker", avatar: Avatar, xlm: 9500.20 },
  { id: "5", name: "HodlGang", avatar: Avatar, xlm: 8200.10 },
  { id: "6", name: "ToTheMoon", avatar: Avatar, xlm: 7600.00 },
  { id: "7", name: "DiamondHands", avatar: Avatar, xlm: 6400.50 },
  { id: "8", name: "RocketMan", avatar: Avatar, xlm: 5100.25 },
  { id: "9", name: "SatoshiFan", avatar: Avatar, xlm: 4300.00 },
  { id: "10", name: "BlockchainBro", avatar: Avatar, xlm: 3200.10 },
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
    <div className="w-full max-w-4xl mx-auto px-4 pb-12">
      <h1 className="text-3xl font-bold text-[#292D32] text-center mb-10">Leaderboard</h1>

      {/* Podium Section */}
      <div className="flex flex-col md:flex-row items-end justify-center gap-6 mb-12">
        
        {/* Rank 2 */}
        {rank2 && (
          <div className="order-2 md:order-1 flex flex-col items-center w-full md:w-1/3">
            <div className="relative mb-2">
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-[#BEC7FE]">
                <img src={rank2.avatar} alt={rank2.name} className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#BEC7FE] text-white text-xs font-bold py-0.5 px-2 rounded-full">
                #2
              </div>
            </div>
            <p className="font-bold text-[#292D32] text-lg">{rank2.name}</p>
            <p className="text-[#2C4BFD] font-semibold">{rank2.xlm.toLocaleString()} XLM</p>
            <div className="w-full h-24 bg-linear-to-t from-[#BEC7FE]/30 to-transparent rounded-t-lg mt-2 hidden md:block"></div>
          </div>
        )}

        {/* Rank 1 */}
        {rank1 && (
          <div className="order-1 md:order-2 flex flex-col items-center w-full md:w-1/3 -mt-10 md:mt-0 z-10">
             <div className="relative mb-3">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-[#2C4BFD] shadow-lg">
                <img src={rank1.avatar} alt={rank1.name} className="w-full h-full object-cover" />
              </div>
               <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#2C4BFD] text-white text-sm font-bold py-1 px-3 rounded-full border-2 border-white">
                #1
              </div>
            </div>
             <p className="font-bold text-[#292D32] text-xl">{rank1.name}</p>
            <p className="text-[#2C4BFD] font-bold text-lg">{rank1.xlm.toLocaleString()} XLM</p>
             <div className="w-full h-32 bg-linear-to-t from-[#2C4BFD]/20 to-transparent rounded-t-xl mt-2 hidden md:block"></div>
          </div>
        )}

        {/* Rank 3 */}
        {rank3 && (
          <div className="order-3 md:order-3 flex flex-col items-center w-full md:w-1/3">
            <div className="relative mb-2">
               <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-[#E5E7EB]">
                <img src={rank3.avatar} alt={rank3.name} className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gray-400 text-white text-xs font-bold py-0.5 px-2 rounded-full">
                #3
              </div>
            </div>
            <p className="font-bold text-[#292D32] text-lg">{rank3.name}</p>
            <p className="text-[#2C4BFD] font-semibold">{rank3.xlm.toLocaleString()} XLM</p>
             <div className="w-full h-16 bg-gradient-to-t from-gray-100 to-transparent rounded-t-lg mt-2 hidden md:block"></div>
          </div>
        )}
      </div>

      {/* Ranked List */}
      <ul className="space-y-3">
        {restUsers.map((user, index) => (
          <li 
            key={user.id} 
            className="flex flex-col items-center gap-2 md:flex-row md:justify-between md:gap-0 bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4 w-full justify-center md:justify-start">
              <span className="text-gray-400 font-bold w-6 text-center">{index + 4}</span>
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              </div>
              <span className="font-semibold text-[#292D32]">{user.name}</span>
            </div>
            <div className="text-center md:text-right w-full md:w-auto">
              <span className="font-bold text-[#2C4BFD]">{user.xlm.toLocaleString()}</span>
              <span className="text-xs text-gray-500 ml-1">XLM</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Leaderboard;
