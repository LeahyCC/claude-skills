// Planted bypasses for audit-classes.mjs. Counts are asserted in check-skill.mjs.
export function Card() {
  return (
    <div className="rounded-lg border border-border bg-card p-4 text-card-foreground data-[state=open]:bg-muted group-[.is-active]:ring-2 w-[320px] text-[13px] bg-[#0f0f0f] grid-cols-[1fr_2fr]">
      <p className="text-gray-700 hover:text-blue-500 bg-slate-50 !mt-0 mb-2! bg-(--brand)" style={{ color: '#333', background: 'rgb(0 0 0 / 50%)' }}>
        hi
      </p>
    </div>
  )
}
