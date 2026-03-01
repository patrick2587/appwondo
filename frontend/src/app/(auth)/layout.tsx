"use client";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-bg-page">
      {/* Content */}
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-6 flex flex-col items-center">
            <img
              src="/logo.png"
              alt="TKD Torgau"
              className="h-20 w-20 rounded-full"
            />
            <h1 className="mt-3 text-xl font-bold font-heading text-text-primary">
              TKD Torgau
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Vereinsportal
            </p>
          </div>

          {/* Card */}
          <div className="rounded-lg border border-border bg-white p-6 shadow-md">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
