import PricingBg from '@/components/pricing/PricingBg'
import LegalFooter from '@/components/legal/LegalFooter'

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pricing-layout">
      <PricingBg />
      {children}
      <LegalFooter />
    </div>
  )
}
