import Image from 'next/image'
import { cn } from '@/utils/cn'

export function BrandLogo({ light = false, className }: { light?: boolean; className?: string }) {
  return (
    <span role="img" aria-label="ClovEnt" className={cn('brand-logo', light ? 'brand-logo--light' : 'brand-logo--dark', className)}>
      {light ? (
        <Image src="/brand/clovent-dark.webp" alt="" width={1800} height={600} sizes="260px" loading="eager" />
      ) : (
        // Display the approved light lockup directly from the original brand sheet.
        <Image src="/brand/clovent-reference.webp" alt="" width={1536} height={1024} sizes="280px" />
      )}
    </span>
  )
}
