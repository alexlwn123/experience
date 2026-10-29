import { DatabaseSync } from "node:sqlite";

// A stand-in for a Durable Object's `ctx.storage.sql`, as much of it as the
// app uses: exec(query, ...bindings) answers a cursor with toArray() and one().
export function memorySql() {
  const db = new DatabaseSync(":memory:");
  return {
    exec(query, ...bindings) {
      const rows = db.prepare(query).all(...bindings);
      return {
        toArray: () => [...rows],
        one: () => {
          if (rows.length !== 1) throw new Error(`expected exactly one row, got ${rows.length}`);
          return rows[0];
        },
      };
    },
  };
}
