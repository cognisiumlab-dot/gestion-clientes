import { createClient } from '@/utils/supabase/server'
import { saveAISettings } from './actions'
import { Save } from 'lucide-react'

export default async function AISettingsPage(props: { searchParams: Promise<{ saved?: string }> }) {
  const searchParams = await props.searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Default prompt if nothing found
  const defaultPrompt = `Eres un asistente experto en creación de propuestas comerciales B2B.
Tu objetivo es analizar una transcripción de llamada de ventas y generar una propuesta estructurada, profesional y persuasiva.
Utiliza los servicios seleccionados como base para la solución técnica.
Estructura la propuesta utilizando Markdown con:
- Introducción
- Diagnóstico del negocio
- Problemas identificados y Oportunidades
- Solución propuesta y Alcance
- Resultados esperados
- Próximos pasos`

  const { data: settings, error } = await supabase
    .from('ai_settings')
    .select('system_prompt')
    .eq('user_id', user?.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = "no rows found" — expected when user hasn't saved settings yet
    return (
      <div style={{ color: '#b91c1c', background: '#fee2e2', padding: '16px 24px', borderRadius: '12px', fontSize: '14px' }}>
        Failed to load AI settings. Please refresh the page.
      </div>
    )
  }

  const systemPrompt = settings?.system_prompt ?? defaultPrompt

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', paddingTop: '16px' }}>
      <header>
        <h1 style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--foreground)' }}>AI Instructions</h1>
        <p style={{ fontSize: '15px', color: 'var(--muted-foreground)', marginTop: '4px' }}>Configure the master prompt that controls the AI behavior when generating proposals.</p>
      </header>

      {searchParams?.saved === '1' && (
        <div style={{ color: '#166534', background: '#dcfce7', padding: '12px 20px', borderRadius: '12px', fontSize: '14px', fontWeight: 500 }}>
          Settings saved successfully.
        </div>
      )}

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '24px', padding: '32px' }}>
        <form action={saveAISettings} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label htmlFor="system_prompt" style={{ fontSize: '15px', fontWeight: 600, color: 'var(--foreground)' }}>System Prompt</label>
            <textarea
              id="system_prompt"
              name="system_prompt"
              defaultValue={systemPrompt}
              rows={15}
              style={{
                width: '100%',
                padding: '24px',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                background: 'var(--background)',
                fontSize: '14px',
                lineHeight: '1.7',
                resize: 'vertical',
                fontFamily: 'var(--font-mono)',
                color: 'var(--foreground)',
                outline: 'none',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
              }}
            />
            <p style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>You can always reset this to the default prompt anytime.</p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-start', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
            <button type="submit" className="hover-lift" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--primary)',
              color: 'var(--primary-foreground)',
              padding: '12px 24px',
              borderRadius: '100px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: '16px',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}>
              <Save size={16} />
              Save Instructions
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
