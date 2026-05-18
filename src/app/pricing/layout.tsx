import PricingBg from '@/components/pricing/PricingBg'

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pricing-layout">
      <PricingBg />
      {children}
    </div>
  )
}
