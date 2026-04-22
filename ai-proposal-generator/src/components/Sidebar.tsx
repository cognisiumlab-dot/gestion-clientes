'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sparkles, LayoutDashboard, Layers, FileText, LogOut, Quote } from 'lucide-react'

export function Sidebar() {
  return (
    <aside style={{
      width: '280px',
      height: '100vh',
      borderRight: '1px solid var(--border)',
      background: 'var(--surface)',
      color: 'var(--foreground)',
      display: 'flex',
      flexDirection: 'column',
      padding: '32px 24px',
      position: 'sticky',
      top: 0
    }}>
      <div style={{ marginBottom: '48px', paddingLeft: '12px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '-0.03em' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', background: 'var(--primary)', color: 'var(--primary-foreground)', borderRadius: '8px' }}>
            <Sparkles size={16} />
          </div>
          <span>Minimalist AI</span>
        </h2>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)', fontWeight: 600, paddingLeft: '12px', marginBottom: '8px' }}>Menu</p>
        <SidebarLink href="/dashboard" icon={<LayoutDashboard size={18} />} label="Dashboard" />
        <SidebarLink href="/dashboard/services" icon={<Layers size={18} />} label="Services Catalog" />
        <SidebarLink href="/dashboard/testimonials" icon={<Quote size={18} />} label="Testimonials" />
        <SidebarLink href="/dashboard/ai-settings" icon={<FileText size={18} />} label="AI Instructions" />
      </nav>

      <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
        <form action="/auth/signout" method="post">
          <button type="submit" className="hover-muted-bg" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            width: '100%',
            borderRadius: 'var(--radius)',
            color: 'var(--muted-foreground)',
            cursor: 'pointer',
            background: 'transparent',
            textAlign: 'left',
            fontWeight: 500,
            transition: 'color 0.2s ease, background 0.2s ease'
          }}>
            <LogOut size={18} />
            <span style={{ fontSize: '14px' }}>Log out</span>
          </button>
        </form>
      </div>
    </aside>
  )
}

function SidebarLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  const pathname = usePathname()
  const isActive = pathname === href || (pathname.startsWith(href) && href !== '/dashboard')
  
  return (
    <Link 
      href={href}
      className={isActive ? '' : 'hover-muted-bg'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        borderRadius: 'var(--radius)',
        color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)',
        background: isActive ? 'var(--muted)' : 'transparent',
        textDecoration: 'none',
        transition: 'background 0.2s, color 0.2s',
        fontSize: '14px',
        fontWeight: isActive ? 600 : 500
      }}
    >
      {icon}
      {label}
    </Link>
  )
}
