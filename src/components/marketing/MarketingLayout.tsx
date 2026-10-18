import { MarketingHeader } from './MarketingHeader'
import { MarketingFooter } from './MarketingFooter'

export function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <div className="brand-site"><MarketingHeader /><main className="site-width site-subpage">{children}</main><MarketingFooter /></div>
}
