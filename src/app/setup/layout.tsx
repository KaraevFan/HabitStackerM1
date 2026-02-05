export default function SetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-[var(--bg-primary)]">
      <div className="mx-auto max-w-lg px-4 py-8">
        {children}
      </div>
    </div>
  );
}
