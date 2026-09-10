import Link from 'next/link'
import { ChevronRight, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ProblemCardProps {
  id: string
  title: string
  category: string
  place: string
  votes: number
  avatar: string
  creator: string
}

export function ProblemCard({ id, title, category, place, votes, avatar, creator }: ProblemCardProps) {
  return (
    <article className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">{avatar}</span>
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {category} · {place}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">by {creator}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-5 sm:justify-end">
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="size-4" /> {votes} supporters
        </span>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/problems/${id}`}>
            View <ChevronRight data-icon="inline-end" />
          </Link>
        </Button>
      </div>
    </article>
  )
}
