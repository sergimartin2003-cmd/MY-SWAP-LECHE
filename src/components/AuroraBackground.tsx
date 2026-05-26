export default function AuroraBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div
        className="absolute rounded-full opacity-20 blur-3xl animate-float"
        style={{
          width: '600px', height: '600px',
          background: 'radial-gradient(circle, rgba(123,47,255,0.6) 0%, transparent 70%)',
          top: '-200px', left: '-100px',
          animationDelay: '0s',
        }}
      />
      <div
        className="absolute rounded-full opacity-15 blur-3xl animate-float"
        style={{
          width: '500px', height: '500px',
          background: 'radial-gradient(circle, rgba(0,212,255,0.5) 0%, transparent 70%)',
          top: '200px', right: '-150px',
          animationDelay: '2s',
        }}
      />
      <div
        className="absolute rounded-full opacity-10 blur-3xl animate-float"
        style={{
          width: '400px', height: '400px',
          background: 'radial-gradient(circle, rgba(0,255,136,0.4) 0%, transparent 70%)',
          bottom: '-100px', left: '30%',
          animationDelay: '4s',
        }}
      />
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,212,255,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,212,255,0.3) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
}
