export default function Avatar({ user, size = 'sm', color, showTooltip = false }) {
  const sizes = {
    xs: 'w-5 h-5 text-xs',
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  if (user?.avatar && user.avatar.startsWith('http')) {
    return (
      <div className="relative group">
        <img
          src={user.avatar}
          alt={user.name}
          className={`${sizes[size]} rounded-full object-cover ring-2 ring-white dark:ring-slate-800`}
          style={color ? { ringColor: color } : {}}
        />
        {showTooltip && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-slate-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            {user.name}
          </div>
        )}
      </div>
    );
  }

  const initials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <div className="relative group">
      <div
        className={`${sizes[size]} rounded-full flex items-center justify-center font-semibold text-white ring-2 ring-white dark:ring-slate-800 flex-shrink-0`}
        style={{ backgroundColor: color || '#6366f1' }}
      >
        {initials}
      </div>
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-slate-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
          {user?.name}
        </div>
      )}
    </div>
  );
}
