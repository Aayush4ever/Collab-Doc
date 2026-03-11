import { Check, Cloud, AlertCircle, Loader2 } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { formatDistanceToNow } from 'date-fns';

export default function SaveStatus() {
  const { isSaving, lastSaved, saveError, hasUnsavedChanges } = useEditorStore();

  if (isSaving) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <Loader2 size={12} className="animate-spin" />
        Saving...
      </span>
    );
  }

  if (saveError) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-red-500">
        <AlertCircle size={12} />
        Save failed
      </span>
    );
  }

  if (hasUnsavedChanges) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-amber-500 dark:text-amber-400">
        <Cloud size={12} />
        Unsaved changes
      </span>
    );
  }

  if (lastSaved) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <Check size={12} className="text-green-500" />
        Saved {formatDistanceToNow(new Date(lastSaved), { addSuffix: true })}
      </span>
    );
  }

  return null;
}
