export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen bg-background flex items-center justify-center p-4 overflow-hidden">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, hsl(25 95% 53% / 0.12), transparent)",
        }}
      />
      {/* Grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "linear-gradient(hsl(0 0% 100%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100%) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="relative z-10 w-full">{children}</div>
    </div>
  )
}
