'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AdvantageItem {
  title: string
  description?: string
}

interface FeatureWithAdvantagesProps {
  title: string
  subtitle?: string
  items: AdvantageItem[]
  className?: string
}

function FeatureWithAdvantages({
  title,
  subtitle,
  items,
  className,
}: FeatureWithAdvantagesProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex flex-col gap-4">
        {(title || subtitle) && (
          <div className="flex flex-col gap-2 mb-4">
            {title && (
              <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-base leading-relaxed text-muted-foreground max-w-xl">
                {subtitle}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, i) => (
            <div key={i} className="flex flex-row gap-4 items-start">
              <div className="mt-0.5 shrink-0 text-primary">
                <Check className="w-4 h-4" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                {item.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export { FeatureWithAdvantages }
