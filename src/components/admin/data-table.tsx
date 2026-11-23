import type { ReactNode } from "react";

export type AdminTableRow = {
  id: string;
  cells: ReactNode[];
};

export function AdminDataTable({
  columns,
  emptyMessage,
  rows,
}: {
  columns: string[];
  emptyMessage: string;
  rows: AdminTableRow[];
}) {
  if (!rows.length) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center">
        <p className="font-semibold">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500">
          <tr>
            {columns.map((column) => (
              <th className="px-5 py-4" key={column}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-zinc-50">
              {row.cells.map((cell, index) => (
                <td
                  className="max-w-[360px] px-5 py-4 text-zinc-700"
                  key={`${row.id}-${index}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
