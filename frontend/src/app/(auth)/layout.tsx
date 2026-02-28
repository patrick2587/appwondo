"use client";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-page p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-white font-heading font-bold text-2xl shadow-md">
            A
          </div>
          <h1 className="mt-3 text-2xl font-bold font-heading text-text-primary">
            Appwondo
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Vereinsportal fuer Taekwondo
          </p>
        </div>

        {/* Card */}
        <div className="rounded-lg border border-border bg-white p-6 shadow-md">
          {children}
        </div>
      </div>
    </div>
  );
}
