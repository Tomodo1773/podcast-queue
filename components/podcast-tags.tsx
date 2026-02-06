import { Badge } from "@/components/ui/badge"

type PodcastTagsProps = {
  tags: string[]
  maxTags?: number
  className?: string
}

/**
 * ポッドキャストのタグを表示するコンポーネント
 */
export function PodcastTags({ tags, maxTags, className }: PodcastTagsProps) {
  if (!tags || tags.length === 0) {
    return null
  }

  const displayTags = maxTags ? tags.slice(0, maxTags) : tags
  const remainingCount = maxTags && tags.length > maxTags ? tags.length - maxTags : 0

  return (
    <div className={`flex flex-wrap gap-1 ${className || ""}`}>
      {displayTags.map((tag) => (
        <Badge key={tag} variant="secondary" className="text-xs">
          {tag}
        </Badge>
      ))}
      {remainingCount > 0 && (
        <Badge variant="outline" className="text-xs">
          +{remainingCount}
        </Badge>
      )}
    </div>
  )
}
