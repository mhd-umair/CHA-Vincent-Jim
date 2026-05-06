import { CustomerDirectoryTable } from "@/components/CustomerDirectoryTable";
import { getCustomerDirectory } from "@/lib/customer-queries";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  q?: string | string[];
  sort?: string | string[];
}>;

function first(v: string | string[] | undefined): string | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export default async function CustomersDirectoryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const q = first(sp.q)?.trim();
  const sortRaw = first(sp.sort);
  const sort =
    sortRaw === "last_activity" || sortRaw === "lifetime_revenue"
      ? sortRaw
      : "name";

  const rows = getCustomerDirectory({
    search: q || undefined,
    limit: 200,
    sort,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text)]">Customers</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
          Search active customers by name or number. Click a row to open the
          customer profile. Lifetime revenue uses posted standard sales only.
        </p>
      </div>

      <form
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
      >
        <label className="flex min-w-[12rem] flex-1 flex-col text-xs text-[var(--muted)]">
          Search
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Name or customer #"
            className="mt-1 rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm text-[var(--text)]"
          />
        </label>
        <label className="flex flex-col text-xs text-[var(--muted)]">
          Sort by
          <select
            name="sort"
            defaultValue={sort}
            className="mt-1 rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm text-[var(--text)]"
          >
            <option value="name">Name</option>
            <option value="last_activity">Last activity</option>
            <option value="lifetime_revenue">Lifetime revenue</option>
          </select>
        </label>
        <button
          type="submit"
          className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
        >
          Apply
        </button>
      </form>

      <CustomerDirectoryTable rows={rows} />
    </div>
  );
}
