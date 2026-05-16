import Wizard from './components/Wizard';

export default function Home() {
  return (
    <div style={{minHeight: '100vh', background: '#0A0A0A', display: 'flex', flexDirection: 'column'}}>
      
      {/* Header */}
      <header style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px', borderBottom: '1px solid #1C1C1C'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
          <div style={{width: '32px', height: '32px', borderRadius: '8px', background: '#38BDF8', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <span style={{fontSize: '16px', fontWeight: '700', color: '#000'}}>d</span>
          </div>
          <span style={{fontSize: '16px', fontWeight: '500', color: '#F5F5F5'}}>decision-ai</span>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
          <a href="/login" style={{fontSize: '14px', color: '#888888', padding: '8px 16px', textDecoration: 'none', borderRadius: '8px', border: '1px solid #222222'}}>
            Sign in
          </a>
          <a href="/register" style={{fontSize: '14px', color: '#000000', padding: '8px 16px', textDecoration: 'none', borderRadius: '8px', background: '#38BDF8', fontWeight: '500'}}>
            Get started
          </a>
        </div>
      </header>

      {/* Main */}
      <main style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px 120px'}}>
        
        {/* Heading */}
        <div style={{textAlign: 'center', marginBottom: '48px', maxWidth: '560px'}}>
          <h1 style={{fontSize: '42px', fontWeight: '600', color: '#F5F5F5', lineHeight: '1.2', marginBottom: '16px', letterSpacing: '-0.5px'}}>
            Fastest way to make decisions<br />
            <span style={{color: '#38BDF8'}}>with AI.</span>
          </h1>
          <p style={{fontSize: '16px', color: '#888888', lineHeight: '1.6'}}>
            Describe your decision. Get research, comparison, and a clear recommendation — in seconds.
          </p>
        </div>

        {/* Wizard */}
        <Wizard />

      </main>

      {/* Footer */}
      <footer style={{textAlign: 'center', padding: '24px', borderTop: '1px solid #1C1C1C'}}>
        <p style={{fontSize: '13px', color: '#444444'}}>Built with AI — decision-ai</p>
      </footer>

    </div>
  );
}