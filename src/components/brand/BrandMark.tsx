import Image from 'next/image'
import { cn } from '@/utils/cn'

type BrandMarkSize = 'sm' | 'md' | 'lg' | 'xl'
const SIZE_CLASSES: Record<BrandMarkSize, string> = {
  sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-14 w-14', xl: 'h-16 w-16',
}

export function BrandMark({ size = 'md', className }: { size?: BrandMarkSize; className?: string }) {
  return (
    <span aria-hidden="true" className={cn('relative inline-flex shrink-0', SIZE_CLASSES[size], className)}>
      <Image src="/brand/clovent-mark.webp" alt="" fill sizes="64px" className="object-contain" />
    </span>
  )
}
