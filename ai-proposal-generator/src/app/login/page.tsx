import { login, signup } from './actions'

export default async function LoginPage(props: { searchParams: Promise<{ error: string }> }) {
  const searchParams = await props.searchParams;
  
  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--background)' }}>
      <form 
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          maxWidth: '400px',
          padding: '48px',
          gap: '24px',
          border: '1px solid var(--border)',
          borderRadius: '24px',
          background: 'var(--surface)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.05)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--foreground)', marginBottom: '8px' }}>Welcome back</h2>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '15px' }}>Sign in to continue to Minimalist AI</p>
        </div>

        {searchParams?.error && (
          <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '12px 16px', borderRadius: '12px', fontSize: '14px', fontWeight: 500 }}>
            {searchParams.error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label htmlFor="email" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>Email address</label>
          <input 
            id="email" 
            name="email" 
            type="email" 
            required 
            placeholder="name@company.com"
            style={{
              padding: '12px 16px',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              background: 'var(--background)',
              color: 'var(--foreground)',
              fontSize: '15px'
            }} 
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label htmlFor="password" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>Password</label>
          <input 
            id="password" 
            name="password" 
            type="password" 
            required 
            placeholder="••••••••"
            style={{
              padding: '12px 16px',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              background: 'var(--background)',
              color: 'var(--foreground)',
              fontSize: '15px'
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
          <button 
            formAction={login} 
            className="hover-lift"
            style={{
              background: 'var(--primary)',
              color: 'var(--primary-foreground)',
              padding: '14px',
              borderRadius: '100px',
              fontWeight: 700,
              fontSize: '15px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s ease'
            }}
          >
            Sign In
          </button>
          <button 
            formAction={signup} 
            className="hover-muted-bg"
            style={{
              background: 'transparent',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
              padding: '14px',
              borderRadius: '100px',
              fontWeight: 700,
              fontSize: '15px',
              cursor: 'pointer',
              transition: 'background 0.2s ease'
            }}
          >
            Create account
          </button>
        </div>
      </form>
    </div>
  )
}
