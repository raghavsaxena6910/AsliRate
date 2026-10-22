import Link from "next/link";
import type { ReactNode } from "react";
import type { Block } from "@/lib/blog/posts";

/** Renders **bold** and [text](/path) inside a line of copy. */
export function Inline({ text }: { text: string }) {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) out.push(<strong key={i++}>{m[1]}</strong>);
    else if (m[3].startsWith("/")) out.push(<Link key={i++} href={m[3]}>{m[2]}</Link>);
    else
      out.push(
        <a key={i++} href={m[3]} target="_blank" rel="noopener noreferrer">
          {m[2]}
        </a>,
      );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.type) {
          case "p":
            return (
              <p key={i}>
                <Inline text={b.text} />
              </p>
            );
          case "h2":
            return (
              <h2 key={i} id={b.id ?? slugify(b.text)}>
                {b.text}
              </h2>
            );
          case "ul":
            return (
              <ul key={i}>
                {b.items.map((t, j) => (
                  <li key={j}>
                    <Inline text={t} />
                  </li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i}>
                {b.items.map((t, j) => (
                  <li key={j}>
                    <Inline text={t} />
                  </li>
                ))}
              </ol>
            );
          case "table":
            return (
              <div key={i} className="table-wrap">
                <table>
                  {b.caption && <caption>{b.caption}</caption>}
                  <thead>
                    <tr>
                      {b.head.map((h, j) => (
                        <th key={j} scope="col" className={b.numeric?.includes(j) ? "num-col" : undefined}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((r, j) => (
                      <tr key={j}>
                        {r.map((c, k) => (
                          <td key={k} className={b.numeric?.includes(k) ? "num-col num" : undefined}>
                            <Inline text={c} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "note":
            return (
              <aside key={i} className="note">
                {b.title && <p className="note-title">{b.title}</p>}
                <p>
                  <Inline text={b.text} />
                </p>
              </aside>
            );
        }
      })}
    </>
  );
}
