import React, { useState } from 'react';
import {
  Users,
  Trophy,
  Flame,
  MessageSquare,
  ThumbsUp,
  UserPlus,
  Copy,
  Check,
  Send,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export const FriendsView: React.FC = () => {
  const { friendFeed, likeFeedPost, addCommentToFeedPost, getLeaderboard } = useWorkout();
  const { currentUser, addFriendByCodeOrUsername } = useAuth();
  const { theme, formatWeight } = useTheme();

  const [activeTab, setActiveTab] = useState<'feed' | 'leaderboard'>('feed');
  const [leaderboardCategory, setLeaderboardCategory] = useState<'normalized' | 'ratio' | 'raw'>('normalized');
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [friendCodeInput, setFriendCodeInput] = useState('');
  const [addFriendStatus, setAddFriendStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const leaderboard = getLeaderboard();

  const handleCopyMyCode = () => {
    if (!currentUser) return;
    navigator.clipboard.writeText(currentUser.friendCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleAddFriendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = addFriendByCodeOrUsername(friendCodeInput);
    setAddFriendStatus(result);
    if (result.success) {
      setFriendCodeInput('');
    }
  };

  const handleSendComment = (postId: string) => {
    const text = commentInputs[postId] || '';
    if (!text.trim()) return;
    addCommentToFeedPost(postId, text);
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header & Private Group Banner */}
      <div className={`p-6 rounded-3xl ${theme.cardBgClass} ${theme.cardBorderClass} border shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6`}>
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Users className="w-3.5 h-3.5" />
            Private Friends Group
          </div>
          <h1 className={`text-2xl font-black ${theme.textPrimaryClass} tracking-tight`}>
            Friends Feed & Leaderboard
          </h1>
          <p className={`text-xs ${theme.textSecondaryClass} mt-1`}>
            Exclusive community feed for you and your inner gym crew.
          </p>
        </div>

        {/* Friend Code Share Box */}
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-stone-950 border border-stone-800">
          <div>
            <p className={`text-[10px] ${theme.textSecondaryClass} uppercase font-bold`}>My Friend Code</p>
            <p className={`text-sm font-black font-mono ${theme.accentClass}`}>{currentUser?.friendCode}</p>
          </div>
          <button
            onClick={handleCopyMyCode}
            className={`p-2 rounded-xl bg-stone-900 hover:bg-stone-800 ${theme.textPrimaryClass} transition-colors`}
            title="Copy friend code"
          >
            {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-stone-800 pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'feed'
                ? `${theme.accentBgClass} text-zinc-950`
                : 'bg-stone-900 text-stone-400 hover:text-white'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Activity Feed</span>
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'leaderboard'
                ? `${theme.accentBgClass} text-zinc-950`
                : 'bg-stone-900 text-stone-400 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Strength Leaderboard</span>
          </button>
        </div>
      </div>

      {/* Add Friend Row */}
      <form onSubmit={handleAddFriendSubmit} className="p-4 rounded-2xl bg-stone-900/50 border border-stone-800 space-y-2">
        <label className={`block text-xs font-semibold ${theme.textSecondaryClass}`}>
          Add Friend by Friend Code or Username
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter code e.g. ALEX99 or username"
            value={friendCodeInput}
            onChange={e => setFriendCodeInput(e.target.value)}
            className={`flex-1 px-4 py-2 rounded-xl bg-stone-950 border ${theme.cardBorderClass} ${theme.textPrimaryClass} text-xs focus:outline-none`}
          />
          <button
            type="submit"
            className={`px-4 py-2 rounded-xl text-xs font-bold ${theme.buttonPrimaryClass} flex items-center gap-1.5`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>
        {addFriendStatus && (
          <p className={`text-xs ${addFriendStatus.success ? 'text-emerald-400' : 'text-rose-400'} font-medium`}>
            {addFriendStatus.message}
          </p>
        )}
      </form>

      {/* Feed View */}
      {activeTab === 'feed' && (
        <div className="space-y-4 max-w-2xl mx-auto">
          {friendFeed.length === 0 ? (
            <div className={`p-8 text-center rounded-3xl ${theme.cardBgClass} ${theme.cardBorderClass} border shadow-xl space-y-3`}>
              <div className="w-12 h-12 rounded-2xl bg-amber-400/10 text-amber-400 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <h3 className={`text-base font-bold ${theme.textPrimaryClass}`}>No Friend Activity Yet</h3>
              <p className={`text-xs ${theme.textSecondaryClass} max-w-sm mx-auto leading-relaxed`}>
                Share your Friend Code with workout partners or enter their code above to view live workout logs, PR celebrations, and leave respect comments!
              </p>
            </div>
          ) : (
            friendFeed.map(post => {

            const isLiked = currentUser ? post.likes.includes(currentUser.id) : false;

            return (
              <div
                key={post.id}
                className={`${theme.cardBgClass} ${theme.cardBorderClass} border rounded-3xl p-5 shadow-xl space-y-4`}
              >
                {/* User Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={post.userAvatar}
                      alt={post.userName}
                      className="w-10 h-10 rounded-full object-cover border border-amber-400/50"
                    />
                    <div>
                      <h3 className={`text-sm font-bold ${theme.textPrimaryClass}`}>{post.userName}</h3>
                      <p className={`text-[11px] ${theme.textSecondaryClass}`}>{post.timestamp}</p>
                    </div>
                  </div>
                </div>

                {/* Workout Title & Volume stats */}
                <div className="space-y-2 pt-1">
                  <h4 className={`text-base font-extrabold ${theme.textPrimaryClass}`}>
                    {post.workoutTitle}
                  </h4>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-stone-950 border border-stone-800 text-stone-300 font-mono font-semibold">
                      ⏱ {post.durationMinutes} mins
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-stone-950 border border-stone-800 text-amber-400 font-mono font-semibold">
                      🏋️‍♂️ Vol: {formatWeight(post.totalVolumeLbs)}
                    </span>
                    {post.prsCount > 0 && (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30 flex items-center gap-1">
                        <Trophy className="w-3.5 h-3.5" />
                        {post.prsCount} PRs
                      </span>
                    )}
                  </div>
                </div>

                {/* Workout Highlights */}
                {post.highlights && post.highlights.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-stone-950/80 border border-stone-800/80 space-y-1.5 text-xs">
                    <p className={`text-[10px] font-bold uppercase ${theme.textSecondaryClass}`}>Highlights</p>
                    {post.highlights.map((hl, i) => (
                      <p key={i} className={`font-medium ${theme.textPrimaryClass}`}>
                        &bull; {hl}
                      </p>
                    ))}
                  </div>
                )}

                {/* Like & Comment Bar */}
                <div className="pt-3 border-t border-stone-800 flex items-center justify-between">
                  <button
                    onClick={() => likeFeedPost(post.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      isLiked
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-sm'
                        : 'bg-stone-900 text-stone-300 border border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    <span>💪</span>
                    <span>{post.likes.length} Respect</span>
                  </button>

                  <span className={`text-xs ${theme.textSecondaryClass} flex items-center gap-1`}>
                    <MessageSquare className="w-4 h-4" />
                    <span>{post.comments.length} Comments</span>
                  </span>
                </div>

                {/* Comments List */}
                {post.comments.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-stone-800/60">
                    {post.comments.map(c => (
                      <div key={c.id} className="p-2.5 rounded-xl bg-stone-950/60 text-xs flex items-start gap-2.5">
                        <img src={c.userAvatar} alt={c.userName} className="w-6 h-6 rounded-full object-cover" />
                        <div>
                          <p className={`font-bold ${theme.textPrimaryClass}`}>
                            {c.userName}{' '}
                            <span className={`font-normal text-[10px] ${theme.textSecondaryClass}`}>&bull; {c.createdAt}</span>
                          </p>
                          <p className={`text-stone-300 mt-0.5`}>{c.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Comment Input */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Write respect comment..."
                    value={commentInputs[post.id] || ''}
                    onChange={e => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                    onKeyDown={e => { if (e.key === 'Enter') handleSendComment(post.id); }}
                    className={`flex-1 px-3.5 py-2 rounded-xl bg-stone-950 border ${theme.cardBorderClass} ${theme.textPrimaryClass} text-xs focus:outline-none`}
                  />
                  <button
                    onClick={() => handleSendComment(post.id)}
                    className={`p-2 rounded-xl ${theme.buttonPrimaryClass}`}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          }))}
        </div>
      )}

      {/* Leaderboard View */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-4 max-w-3xl mx-auto">
          <div className={`${theme.cardBgClass} ${theme.cardBorderClass} border rounded-3xl p-6 shadow-xl space-y-5`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-800">
              <div>
                <h3 className={`text-base font-bold ${theme.textPrimaryClass} flex items-center gap-2`}>
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <span>Strength Leaderboard</span>
                </h3>
                <p className={`text-xs ${theme.textSecondaryClass} mt-0.5`}>
                  Compare raw totals, pound-for-pound ratios, and height-age adjusted strength indexes.
                </p>
              </div>

              {/* Category Filter Pills */}
              <div className="flex gap-1 p-1 rounded-2xl bg-stone-950 border border-stone-800 shrink-0">
                <button
                  onClick={() => setLeaderboardCategory('normalized')}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                    leaderboardCategory === 'normalized'
                      ? `${theme.accentBgClass} text-zinc-950`
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Height & Age Index
                </button>
                <button
                  onClick={() => setLeaderboardCategory('ratio')}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                    leaderboardCategory === 'ratio'
                      ? `${theme.accentBgClass} text-zinc-950`
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Strength/BW
                </button>
                <button
                  onClick={() => setLeaderboardCategory('raw')}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                    leaderboardCategory === 'raw'
                      ? `${theme.accentBgClass} text-zinc-950`
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Raw Lbs
                </button>
              </div>
            </div>

            {leaderboard.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-stone-950/60 border border-stone-800 space-y-2">
                <Trophy className="w-8 h-8 text-stone-500 mx-auto" />
                <p className={`text-sm font-bold ${theme.textPrimaryClass}`}>No Leaderboard Entries Yet</p>
                <p className={`text-xs ${theme.textSecondaryClass}`}>
                  Sign up or log a workout to feature on the Big Three strength leaderboard!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {[...leaderboard]
                  .sort((a, b) => {
                    const aVal = leaderboardCategory === 'normalized' ? (a.relativeStrengthScore || 0)
                               : leaderboardCategory === 'ratio' ? (a.strengthToWeightRatio || 0)
                               : (a.totalBigThree || 0);
                    const bVal = leaderboardCategory === 'normalized' ? (b.relativeStrengthScore || 0)
                               : leaderboardCategory === 'ratio' ? (b.strengthToWeightRatio || 0)
                               : (b.totalBigThree || 0);
                    return bVal - aVal;
                  })
                  .map((entry, idx) => {
                    const isMe = currentUser?.id === entry.userId;
                    const feet = entry.heightInches ? Math.floor(entry.heightInches / 12) : 5;
                    const inches = entry.heightInches ? entry.heightInches % 12 : 10;

                    return (
                      <div
                        key={entry.userId}
                        className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                          isMe
                            ? `${theme.badgeBgClass} ${theme.accentBorderClass}`
                            : 'bg-stone-950/60 border-stone-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                            idx === 0 ? 'bg-amber-400 text-zinc-950' : idx === 1 ? 'bg-stone-300 text-zinc-950' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-stone-800 text-stone-400'
                          }`}>
                            #{idx + 1}
                          </span>
                          <img src={entry.userAvatar} alt={entry.userName} className="w-10 h-10 rounded-full object-cover border border-stone-700 shrink-0" />
                          <div>
                            <p className={`text-sm font-bold ${theme.textPrimaryClass} flex items-center gap-1.5`}>
                              <span>{entry.userName}</span>
                              {isMe && <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-extrabold">(You)</span>}
                            </p>
                            <p className={`text-xs ${theme.textSecondaryClass} font-mono mt-0.5`}>
                              Bench: {entry.benchPressMax || 0} &bull; Squat: {entry.squatMax || 0} &bull; DL: {entry.deadliftMax || 0}
                            </p>
                            <div className="flex flex-wrap gap-2 text-[10px] text-stone-400 mt-1">
                              <span>Height: {feet}'{inches}"</span>
                              <span>&bull;</span>
                              <span>Age: {entry.age || 25}</span>
                              <span>&bull;</span>
                              <span>BW: {entry.bodyweightLbs || 180} lbs</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right sm:text-right flex sm:flex-col justify-between items-end border-t sm:border-0 border-stone-800/80 pt-2 sm:pt-0">
                          {leaderboardCategory === 'normalized' ? (
                            <>
                              <p className={`text-xl font-black font-mono ${theme.accentClass}`}>
                                {(entry.relativeStrengthScore || 0).toFixed(1)} <span className="text-xs font-normal">pts</span>
                              </p>
                              <p className={`text-[10px] ${theme.textSecondaryClass}`}>Height-Age-BW Ratio Index</p>
                            </>
                          ) : leaderboardCategory === 'ratio' ? (
                            <>
                              <p className={`text-xl font-black font-mono ${theme.accentClass}`}>
                                {(entry.strengthToWeightRatio || 0).toFixed(2)}x <span className="text-xs font-normal">BW</span>
                              </p>
                              <p className={`text-[10px] ${theme.textSecondaryClass}`}>Strength-to-Weight Ratio</p>
                            </>
                          ) : (
                            <>
                              <p className={`text-xl font-black font-mono ${theme.accentClass}`}>
                                {formatWeight(entry.totalBigThree || 0)}
                              </p>
                              <p className={`text-[10px] ${theme.textSecondaryClass}`}>Big 3 Total Lbs</p>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
