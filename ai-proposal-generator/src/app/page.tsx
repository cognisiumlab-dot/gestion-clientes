import { Sparkles, ArrowRight } from 'lucide-react'

export default function Home() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "32px", background: 'var(--background)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: "center", maxWidth: "600px", gap: '16px' }}>
        <div style={{ padding: '12px', background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', marginBottom: '16px' }}>
          <Sparkles size={32} />
        </div>
        <h1 style={{ fontSize: "56px", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: "1.1", color: 'var(--foreground)' }}>
          AI Proposal Generator
        </h1>
        <p style={{ color: "var(--muted-foreground)", fontSize: '18px', maxWidth: '400px', lineHeight: '1.6' }}>
          Transcribe calls into actionable, professional proposals instantly.
        </p>
      </div>

      <div style={{ display: "flex", gap: "16px", marginTop: '16px' }}>
        <a
          href="/dashboard"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: "var(--primary)",
            color: "var(--primary-foreground)",
            padding: "16px 32px",
            borderRadius: "100px",
            fontWeight: 600,
            fontSize: "15px",
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            letterSpacing: '-0.01em'
          }}
        >
          Go to Dashboard
          <ArrowRight size={18} />
        </a>
      </div>
    </main>
  );
}
