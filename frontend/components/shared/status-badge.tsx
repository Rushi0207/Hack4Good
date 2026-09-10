export function StatusBadge({ status }: { status: string }) {
  const tone = status === 'active' || status === 'winner' || status === 'in-progress' ? 'bg-primary/10 text-primary' : status === 'upcoming' || status === 'submitted' || status === 'runner-up' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-muted text-muted-foreground'
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
}
