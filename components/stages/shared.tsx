import { cn as _cn } from "@/lib/utils"

export function cn(...classes: (string | boolean | undefined | null)[]) {
  return _cn(...(classes.filter(Boolean) as string[]))
}

export function StepBar({ total, current }: { total: number; current: number }) {
  return (
    <div className="mb-8">
      <div className="flex gap-1 mb-2">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              i + 1 < current ? "bg-orange-600" : i + 1 === current ? "bg-orange-400" : "bg-gray-200"
            )}
          />
        ))}
      </div>
      <p className="text-xs text-gray-400">
        Step {current} of {total}
      </p>
    </div>
  )
}

export function StepNav({
  step,
  total,
  canNext,
  loading,
  onBack,
  onNext,
  onSubmit,
  submitLabel = "Complete Stage →",
}: {
  step: number
  total: number
  canNext: boolean
  loading?: boolean
  onBack: () => void
  onNext: () => void
  onSubmit: () => void
  submitLabel?: string
}) {
  return (
    <div className="mt-8 flex items-center justify-between">
      {step > 1 ? (
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
          ← Back
        </button>
      ) : (
        <div />
      )}
      {step < total ? (
        <button
          onClick={onNext}
          disabled={!canNext}
          className="bg-orange-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Continue →
        </button>
      ) : (
        <button
          onClick={onSubmit}
          disabled={!canNext || loading}
          className="bg-orange-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Saving…" : submitLabel}
        </button>
      )}
    </div>
  )
}

export function StepHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  )
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

export function TextInput({
  value,
  onChange,
  placeholder,
  autoFocus,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoFocus?: boolean
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
    />
  )
}

export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 4,
  autoFocus,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
  autoFocus?: boolean
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      autoFocus={autoFocus}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
    />
  )
}

export function CheckCard({
  checked,
  onChange,
  title,
  description,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  title: string
  description?: string
}) {
  return (
    <label
      className={cn(
        "flex gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors",
        checked ? "border-orange-500 bg-orange-50" : "border-gray-200 bg-white hover:border-gray-300"
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 accent-orange-600 shrink-0"
      />
      <div>
        <p className="font-medium text-gray-900 text-sm">{title}</p>
        {description && <p className="text-gray-500 text-sm mt-0.5">{description}</p>}
      </div>
    </label>
  )
}

export function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{label}</p>
      {children}
    </div>
  )
}

export function CheckRow({ checked, label }: { checked: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn("w-4 h-4 rounded flex items-center justify-center shrink-0", checked ? "bg-green-100" : "bg-gray-100")}>
        {checked && (
          <svg className="w-2.5 h-2.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <p className="text-sm text-gray-700">{label}</p>
    </div>
  )
}

export function StagePanelHeader({
  stageNum,
  title,
  state,
  completedAt,
  isExpanded,
  onToggle,
}: {
  stageNum: number
  title: string
  state: "completed" | "active" | "locked"
  completedAt?: Date | null
  isExpanded?: boolean
  onToggle?: () => void
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-5",
        state === "completed" && "cursor-pointer select-none"
      )}
      onClick={state === "completed" ? onToggle : undefined}
    >
      {state === "completed" && (
        <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center shrink-0">
          <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
      {state === "active" && (
        <div className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
          <div className="w-2 h-2 bg-orange-500 rounded-full" />
        </div>
      )}
      {state === "locked" && (
        <div className="w-5 h-5 rounded-full border-2 border-gray-200 shrink-0" />
      )}
      <p className={cn("font-semibold text-sm", state === "locked" ? "text-gray-400" : "text-gray-900")}>
        Stage {stageNum}: {title}
      </p>
      {state === "completed" && completedAt && (
        <span className="ml-auto text-xs text-gray-400 shrink-0">
          {new Date(completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          <span className="ml-2">{isExpanded ? "▲" : "▼"}</span>
        </span>
      )}
      {state === "active" && (
        <span className="ml-auto text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
          In Progress
        </span>
      )}
    </div>
  )
}
