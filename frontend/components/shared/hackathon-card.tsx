import Link from 'next/link'
import { ArrowRight, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/status-badge'

interface HackathonCardProps {
  id: string
  title: string
  tag: string
  date: string
  place: string
  image: string
  color: string
  status: string
}

export function HackathonCard({ id, title, tag, date, place, image, color, status }: HackathonCardProps) {
  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-lg">
      <img src={image} alt="" className="aspect-[16/9] w-full object-cover" />
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${color}`}>{tag}</span>
          <StatusBadge status={status} />
        </div>
        <h3 className="text-lg font-semibold leading-snug">{title}</h3>
        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <span>{date}</span>
          <span className="flex items-center gap-1.5">
            <MapPin className="size-4" />
            {place}
          </span>
        </div>
        <Button variant="outline" className="mt-1" asChild>
          <Link href={`/hackathons/${id}`}>
            View details <ArrowRight data-icon="inline-end" />
          </Link>
        </Button>
      </div>
    </article>
  )
}
