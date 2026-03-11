import Avatar from '../ui/Avatar';
import { useEditorStore } from '../../store/editorStore';

export default function ActiveUsers() {
  const { activeUsers } = useEditorStore();

  if (activeUsers.length === 0) return null;

  const MAX_SHOWN = 4;
  const shown = activeUsers.slice(0, MAX_SHOWN);
  const extra = activeUsers.length - MAX_SHOWN;

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center -space-x-2">
        {shown.map((user) => (
          <div key={user.socketId} className="relative group">
            <Avatar user={user} size="sm" color={user.color} showTooltip />
            <span
              className="absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white dark:border-slate-800"
              style={{ backgroundColor: user.color }}
            />
          </div>
        ))}
        {extra > 0 && (
          <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-medium text-slate-600 dark:text-slate-400 ring-2 ring-white dark:ring-slate-800">
            +{extra}
          </div>
        )}
      </div>
      <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
        {activeUsers.length} {activeUsers.length === 1 ? 'viewer' : 'viewers'}
      </span>
    </div>
  );
}
