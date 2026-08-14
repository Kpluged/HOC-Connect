export type Footnote = {
  id: string;
  text: string;
};

export function Footnotes({ items }: { items: Footnote[] }) {
  return (
    <aside aria-label="Notes" className="border-t border-contrast-low pt-5">
      <ol className="grid gap-2 text-xs leading-5 text-contrast-medium">
        {items.map((item, index) => (
          <li className="flex gap-3" id={item.id} key={item.id}>
            <span className="tabular-nums">{index + 1}</span>
            <span>{item.text}</span>
          </li>
        ))}
      </ol>
    </aside>
  );
}
