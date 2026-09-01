import { useParams, Link } from 'react-router-dom';
import { Share2, AlertCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const MOCK_PROFILE = {
  name: 'Xelma User',
  bio: 'Exploring the Xelma ecosystem and participating in prediction markets.',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Xelma',
  followers: 1337,
  following: 42,
  badges: ['Early Adopter', 'Top Predictor'],
};

export default function PublicProfileCard() {
  const { handle, id } = useParams<{ handle?: string; id?: string }>();
  const identifier = handle || id;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Profile link copied to clipboard!');
  };

  // Simulate a 404 if the identifier is exactly "missing" or "not-found"
  const isMissing = identifier === 'missing' || identifier === 'not-found';

  if (isMissing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-3xl font-bold text-white mb-2">Profile Not Found</h1>
        <p className="text-[#BEC7FE] mb-6">The user you are looking for does not exist or has been removed.</p>
        <Link 
          to="/" 
          className="flex items-center gap-2 bg-[#2C4BFD] hover:bg-[#3d5af5] text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 w-full animate-in fade-in duration-500">
      <div className="bg-[#111827] border border-[#2C4BFD]/20 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-[#2C4BFD]/20 to-purple-500/20 opacity-50" />
        
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-[#0A0F1A] shadow-lg overflow-hidden bg-[#1A2333] shrink-0">
                <img 
                  src={MOCK_PROFILE.avatar} 
                  alt={MOCK_PROFILE.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">{MOCK_PROFILE.name}</h1>
                <p className="text-[#BEC7FE] text-lg mt-1">@{identifier || 'user'}</p>
                <div className="flex gap-2 mt-3">
                  {MOCK_PROFILE.badges.map((badge) => (
                    <span key={badge} className="text-xs font-medium bg-[#2C4BFD]/10 text-[#BEC7FE] border border-[#2C4BFD]/20 px-2.5 py-1 rounded-full">
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleShare}
              className="flex items-center gap-2 bg-[#1A2333] hover:bg-[#232f45] border border-[#2C4BFD]/30 text-white px-4 py-2 rounded-lg font-medium transition-colors sm:self-start shrink-0"
              title="Share profile"
            >
              <Share2 className="w-4 h-4" />
              <span className="sm:hidden lg:inline">Share</span>
            </button>
          </div>

          <div className="mt-8 pt-8 border-t border-[#1A2333]/50">
            <p className="text-gray-300 text-base sm:text-lg mb-8 leading-relaxed">
              {MOCK_PROFILE.bio}
            </p>
            
            <div className="flex gap-8 text-[#BEC7FE]">
              <div className="flex flex-col">
                <span className="text-white text-2xl font-bold">{MOCK_PROFILE.followers.toLocaleString()}</span>
                <span className="text-sm font-medium uppercase tracking-wider opacity-70">Followers</span>
              </div>
              <div className="flex flex-col">
                <span className="text-white text-2xl font-bold">{MOCK_PROFILE.following.toLocaleString()}</span>
                <span className="text-sm font-medium uppercase tracking-wider opacity-70">Following</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
