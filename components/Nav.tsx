import Link from "next/link";

const link =
  "rounded-lg px-3 py-2 text-sm font-medium text-[var(--muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--text)]";

const deptLink =
  "rounded-lg px-3 py-2 text-sm font-medium text-[var(--text)] transition hover:bg-[var(--surface-hover)]";

export function Nav() {
  return (
    <header className="border-b border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight text-[var(--text)]">
          Perseus Equipment
        </Link>
        <nav className="flex flex-wrap items-center gap-1">
          <Link href="/" className={deptLink}>
            Management
          </Link>
          <Link href="/sales" className={deptLink}>
            Sales
          </Link>
          <Link href="/parts" className={deptLink}>
            Parts
          </Link>
          <Link href="/equipment" className={deptLink}>
            Equipment
          </Link>
          <Link href="/service" className={deptLink}>
            Service
          </Link>
          <Link href="/finance" className={deptLink}>
            Finance
          </Link>
          <span className="mx-1 h-5 w-px bg-[var(--border)]" aria-hidden />
          <Link href="/customers" className={link}>
            Customers
          </Link>
          <Link href="/explore" className={link}>
            Ask data
          </Link>
          <Link href="/dashboard" className={link}>
            My dashboard
          </Link>
        </nav>
      </div>
    </header>
  );
}
