'use client'

import { useState } from 'react'
import { ArrowRight, Lock, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PaymentPlan {
  id: string
  label: string
  description: string
  /** e.g. 1497 */
  totalAmount: number
  /** how many payments */
  installments: number
  /** fee multiplier, e.g. 0.05 for +5% */
  feePercent?: number
  recommended?: boolean
}

interface ProposalPricingProps {
  /** Base price before any fees */
  basePrice: number
  currency?: string
  ctaLabel?: string
  /** Extra installment options beyond the defaults */
  extraInstallments?: number[]
  onSelect?: (plan: PaymentPlan) => void
  className?: string
}

function buildPlans(basePrice: number, currency: string, extraInstallments: number[]): PaymentPlan[] {
  const installmentCounts = [1, 2, ...extraInstallments].sort((a, b) => a - b)

  return installmentCounts.map((n) => {
    const feePercent = n === 1 ? 0 : (n - 1) * 0.05
    const total = Math.round(basePrice * (1 + feePercent))
    const perInstallment = Math.round(total / n)

    return {
      id: `plan-${n}`,
      label: n === 1 ? 'Pay Upfront' : `Split in ${n} Installments`,
      description:
        n === 1
          ? 'Pay the full amount upfront. Fully commit for the highest chance of success.'
          : n === 2
          ? 'Pay one installment now and another in 30 days.'
          : `Pay ${n} equal installments, one every 30 days.`,
      totalAmount: total,
      installments: n,
      feePercent: feePercent > 0 ? feePercent : undefined,
      recommended: n === 1,
    }
  })
}

function formatPrice(amount: number, currency: string) {
  return `${currency}${amount.toLocaleString()}`
}

export function ProposalPricing({
  basePrice,
  currency = '$',
  ctaLabel = 'Get access',
  extraInstallments = [],
  onSelect,
  className,
}: ProposalPricingProps) {
  const plans = buildPlans(basePrice, currency, extraInstallments)
  const [selectedId, setSelectedId] = useState(plans[0].id)

  const selectedPlan = plans.find((p) => p.id === selectedId)!

  return (
    <div className={cn('w-full max-w-sm mx-auto', className)}>
      <div className="rounded-2xl overflow-hidden border border-border bg-surface shadow-lg">
        {/* Header */}
        <div className="bg-foreground px-6 py-4">
          <h3 className="text-base font-bold text-primary-foreground text-center tracking-tight">
            Select Payment
          </h3>
        </div>

        {/* Plans */}
        <div className="p-4 flex flex-col gap-3">
          {plans.map((plan) => {
            const isSelected = plan.id === selectedId
            const perInstallment = Math.round(plan.totalAmount / plan.installments)

            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedId(plan.id)}
                className={cn(
                  'w-full text-left rounded-xl border-2 p-4 transition-all duration-200',
                  isSelected
                    ? 'border-blue-500 bg-blue-50/60'
                    : 'border-border bg-background hover:border-muted-foreground/30'
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Radio dot */}
                  <div
                    className={cn(
                      'mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                      isSelected ? 'border-blue-500' : 'border-muted-foreground/40'
                    )}
                  >
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-foreground">
                        {plan.label}
                      </span>
                      {plan.recommended && (
                        <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                          Recommended
                        </span>
                      )}
                      {plan.feePercent !== undefined && (
                        <span className="text-xs text-muted-foreground">
                          (+{Math.round(plan.feePercent * 100)}% fee)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {plan.description}
                    </p>
                    <p className="mt-2 text-base font-bold text-blue-600">
                      {plan.installments === 1
                        ? formatPrice(plan.totalAmount, currency)
                        : `${formatPrice(perInstallment, currency)} x${plan.installments}`}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* CTA */}
        <div className="px-4 pb-4">
          <button
            type="button"
            onClick={() => onSelect?.(selectedPlan)}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3.5 px-6 rounded-xl transition-colors duration-200 text-sm"
          >
            {ctaLabel}
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Trust row */}
          <div className="flex items-center justify-center gap-4 mt-3">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="w-3 h-3" />
              Secure checkout
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="w-3 h-3" />
              14-Day Guarantee
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
