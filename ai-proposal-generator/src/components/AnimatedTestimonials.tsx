'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { useEffect, useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type Testimonial = {
  id: string
  quote: string
  client_name: string
  client_role: string
  photo_url: string | null
}

const DEFAULT_PHOTO = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=400&auto=format&fit=crop'

function randomRotateY() {
  return Math.floor(Math.random() * 21) - 10
}

export function AnimatedTestimonials({
  testimonials,
  autoplay = true,
}: {
  testimonials: Testimonial[]
  autoplay?: boolean
}) {
  const [active, setActive] = useState(0)

  const handleNext = useCallback(() => {
    setActive((prev) => (prev + 1) % testimonials.length)
  }, [testimonials.length])

  const handlePrev = useCallback(() => {
    setActive((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }, [testimonials.length])

  useEffect(() => {
    if (autoplay && testimonials.length > 1) {
      const interval = setInterval(handleNext, 5000)
      return () => clearInterval(interval)
    }
  }, [autoplay, handleNext, testimonials.length])

  if (testimonials.length === 0) return null

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '80px 80px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center' }}>
        {/* Image stack */}
        <div style={{ position: 'relative', height: '320px' }}>
          <AnimatePresence>
            {testimonials.map((t, index) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, scale: 0.9, rotate: randomRotateY() }}
                animate={{
                  opacity: index === active ? 1 : 0.5,
                  scale: index === active ? 1 : 0.92,
                  rotate: index === active ? 0 : randomRotateY(),
                  zIndex: index === active ? 999 : testimonials.length + 2 - index,
                  y: index === active ? [0, -20, 0] : 0,
                }}
                exit={{ opacity: 0, scale: 0.9, rotate: randomRotateY() }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
                style={{ position: 'absolute', inset: 0 }}
              >
                <Image
                  src={t.photo_url || DEFAULT_PHOTO}
                  alt={t.client_name}
                  width={400}
                  height={400}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '24px', draggable: 'false' } as React.CSSProperties}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '320px', paddingTop: '16px' }}>
          <motion.div
            key={active}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.03em' }}>
              {testimonials[active].client_name}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginTop: '4px', letterSpacing: '0.02em' }}>
              {testimonials[active].client_role}
            </p>
            <motion.p style={{ fontSize: '17px', lineHeight: '1.7', color: 'var(--muted-foreground)', marginTop: '24px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {testimonials[active].quote.split(' ').map((word, i) => (
                <motion.span
                  key={`${active}-${i}`}
                  initial={{ filter: 'blur(8px)', opacity: 0, y: 4 }}
                  animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut', delay: 0.015 * i }}
                  style={{ display: 'inline-block' }}
                >
                  {word}&nbsp;
                </motion.span>
              ))}
            </motion.p>
          </motion.div>

          {testimonials.length > 1 && (
            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
              <button
                onClick={handlePrev}
                style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'var(--muted)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'var(--foreground)',
                  transition: 'transform 0.2s'
                }}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={handleNext}
                style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'var(--muted)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'var(--foreground)',
                  transition: 'transform 0.2s'
                }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
