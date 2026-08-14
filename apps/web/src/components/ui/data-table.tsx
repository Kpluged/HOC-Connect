import type { ReactNode } from "react";

export type DataColumn = {
  align?: "left" | "right";
  key: string;
  label: ReactNode;
};

export type DataRow = {
  id: string;
  values: Record<string, ReactNode>;
};

export function DataTable({
  caption,
  columns,
  rows,
}: {
  caption: string;
  columns: DataColumn[];
  rows: DataRow[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-160 border-collapse text-[1.0625rem]">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-y border-contrast-low text-left text-xs text-contrast-medium">
            {columns.map((column) => (
              <th
                className={cnAlignment(column.align, "py-3 font-normal")}
                key={column.key}
                scope="col"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr className="border-b border-contrast-low" key={row.id}>
              {columns.map((column) => (
                <td
                  className={cnAlignment(column.align, "py-5 text-contrast-high")}
                  key={column.key}
                >
                  {row.values[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function cnAlignment(
  align: DataColumn["align"],
  base: string,
): string {
  return `${base} ${align === "right" ? "text-right" : "text-left"}`;
}
