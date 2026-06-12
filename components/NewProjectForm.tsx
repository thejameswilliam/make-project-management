"use client"

import { useState } from "react"
import { createProject } from "@/app/actions/projects"
import { cn } from "@/lib/utils"

type CoreValue = { id: string; name: string }
type OneYearGoal = { id: string; description: string }

type FormData = {
  name: string
  problemStatement: string
  missionAlignment: boolean
  nicheFit: boolean
  tenYearAlignment: boolean
  coreValueName: string
  noCoreValueViolated: boolean
  oneYearPlanGoal: string
  isStrategicException: boolean
  strategicExceptionNote: string
  noDistractionRisk: boolean
}

const STEPS = [
  "Project Name",
  "Problem Statement",
  "Core Focus",
  "Core Values",
  "1-Year Plan",
  "Review & Submit",
]

export function NewProjectForm({
  coreValues = [],
  oneYearGoals = [],
}: {
  coreValues?: CoreValue[]
  oneYearGoals?: OneYearGoal[]
}) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState<FormData>({
    name: "",
    problemStatement: "",
    missionAlignment: false,
    nicheFit: false,
    tenYearAlignment: false,
    coreValueName: "",
    noCoreValueViolated: false,
    oneYearPlanGoal: "",
    isStrategicException: false,
    strategicExceptionNote: "",
    noDistractionRisk: false,
  })

  // multi-select state for checkbox-based core values
  const [selectedValues, setSelectedValues] = useState<string[]>([])
  // multi-select state for checkbox-based goals
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function toggleValue(name: string) {
    setSelectedValues((prev) =>
      prev.includes(name) ? prev.filter((v) => v !== name) : [...prev, name]
    )
  }

  function toggleGoal(desc: string) {
    setSelectedGoals((prev) =>
      prev.includes(desc) ? prev.filter((g) => g !== desc) : [...prev, desc]
    )
  }

  function canAdvance(): boolean {
    switch (step) {
      case 1:
        return form.name.trim().length > 0
      case 2:
        return form.problemStatement.trim().length > 15
      case 3:
        return form.missionAlignment && form.nicheFit && form.tenYearAlignment
      case 4: {
        const valueLabel = coreValues.length > 0
          ? selectedValues.length > 0
          : form.coreValueName.trim().length > 0
        return valueLabel && form.noCoreValueViolated
      }
      case 5:
        if (form.isStrategicException) return form.strategicExceptionNote.trim().length > 0
        if (oneYearGoals.length > 0) return selectedGoals.length > 0
        return form.oneYearPlanGoal.trim().length > 0
      case 6:
        return form.noDistractionRisk
      default:
        return false
    }
  }

  async function handleSubmit() {
    if (!canAdvance()) return
    setLoading(true)
    setError("")

    const resolvedCoreValueName = coreValues.length > 0
      ? selectedValues.join(", ")
      : form.coreValueName

    const resolvedOneYearPlanGoal = !form.isStrategicException && oneYearGoals.length > 0
      ? selectedGoals.join("\n")
      : form.oneYearPlanGoal

    try {
      await createProject({ ...form, coreValueName: resolvedCoreValueName, oneYearPlanGoal: resolvedOneYearPlanGoal })
    } catch {
      setError("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex gap-1 mb-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i + 1 < step
                  ? "bg-orange-600"
                  : i + 1 === step
                  ? "bg-orange-400"
                  : "bg-gray-200"
              )}
            />
          ))}
        </div>
        <p className="text-xs text-gray-500">
          Step {step} of {STEPS.length} — {STEPS[step - 1]}
        </p>
      </div>

      {/* Step 1: Name */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">What's the project called?</h2>
            <p className="text-gray-500 text-sm mt-1">
              Choose a short, memorable name. This will be used in all future communications.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Project Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && canAdvance() && setStep(2)}
              placeholder="e.g. 3D Printer Access Expansion"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Step 2: Problem Statement */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">What problem does this solve?</h2>
            <p className="text-gray-500 text-sm mt-1">
              Be specific. Not "grow membership" but "address the packed waiting times for access
              to 3D printers for existing members."
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Problem or Opportunity Statement
            </label>
            <textarea
              value={form.problemStatement}
              onChange={(e) => set("problemStatement", e.target.value)}
              rows={5}
              placeholder="What problem does this solve, or what opportunity does this capture?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
            />
          </div>
        </div>
      )}

      {/* Step 3: Core Focus Filter */}
      {step === 3 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Core Focus Filter</h2>
            <p className="text-gray-500 text-sm mt-1">
              All three must be Yes to advance this initiative.
            </p>
          </div>
          <div className="space-y-3">
            {(
              [
                {
                  key: "missionAlignment" as const,
                  label: "Mission Alignment",
                  description:
                    "Does this initiative serve Make's purpose — democratizing access to making and creative tools in Santa Fe?",
                },
                {
                  key: "nicheFit" as const,
                  label: "Niche Fit",
                  description:
                    "Does this fall within what Make does better than any other Santa Fe organization — community-based hands-on making, education, and shared tools?",
                },
                {
                  key: "tenYearAlignment" as const,
                  label: "10-Year Target Alignment",
                  description:
                    "Does this move Make toward its long-term vision, not just solve a short-term problem?",
                },
              ] as const
            ).map(({ key, label, description }) => (
              <label
                key={key}
                className={cn(
                  "flex gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors",
                  form[key]
                    ? "border-orange-500 bg-orange-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                )}
              >
                <input
                  type="checkbox"
                  checked={form[key]}
                  onChange={(e) => set(key, e.target.checked)}
                  className="mt-0.5 accent-orange-600 shrink-0"
                />
                <div>
                  <p className="font-medium text-gray-900 text-sm">{label}</p>
                  <p className="text-gray-500 text-sm mt-0.5">{description}</p>
                </div>
              </label>
            ))}
          </div>
          {(!form.missionAlignment || !form.nicheFit || !form.tenYearAlignment) && (
            <p className="text-amber-700 text-sm bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              All three filters must be checked Yes to advance.
            </p>
          )}
        </div>
      )}

      {/* Step 4: Core Values */}
      {step === 4 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Core Values Check</h2>
            <p className="text-gray-500 text-sm mt-1">
              {coreValues.length > 0
                ? "Select the Make Core Values this initiative embodies, and confirm no values are violated."
                : "Name at least one Make Core Value this initiative embodies, and confirm no values are violated."}
            </p>
          </div>

          {coreValues.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Core Value(s) Embodied</p>
              {coreValues.map((cv) => (
                <label
                  key={cv.id}
                  className={cn(
                    "flex gap-3 p-3.5 rounded-lg border-2 cursor-pointer transition-colors",
                    selectedValues.includes(cv.name)
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(cv.name)}
                    onChange={() => toggleValue(cv.name)}
                    className="mt-0.5 accent-orange-600 shrink-0"
                  />
                  <span className="text-sm font-medium text-gray-900">{cv.name}</span>
                </label>
              ))}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Core Value(s) Embodied
              </label>
              <input
                type="text"
                value={form.coreValueName}
                onChange={(e) => set("coreValueName", e.target.value)}
                placeholder="e.g. Access, Community, Education"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                autoFocus
              />
            </div>
          )}

          <label
            className={cn(
              "flex gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors",
              form.noCoreValueViolated
                ? "border-orange-500 bg-orange-50"
                : "border-gray-200 bg-white hover:border-gray-300"
            )}
          >
            <input
              type="checkbox"
              checked={form.noCoreValueViolated}
              onChange={(e) => set("noCoreValueViolated", e.target.checked)}
              className="mt-0.5 accent-orange-600 shrink-0"
            />
            <div>
              <p className="font-medium text-gray-900 text-sm">No Core Value Violated</p>
              <p className="text-gray-500 text-sm mt-0.5">
                No Make Core Value is obviously violated by this initiative.
              </p>
            </div>
          </label>
        </div>
      )}

      {/* Step 5: 1-Year Plan */}
      {step === 5 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">1-Year Plan Relevance</h2>
            <p className="text-gray-500 text-sm mt-1">
              Connect this initiative to Make's current annual goals.
            </p>
          </div>
          <div className="space-y-2">
            <label
              className={cn(
                "flex gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors",
                !form.isStrategicException
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              )}
            >
              <input
                type="radio"
                name="planType"
                checked={!form.isStrategicException}
                onChange={() => set("isStrategicException", false)}
                className="mt-0.5 accent-orange-600 shrink-0"
              />
              <p className="font-medium text-gray-900 text-sm">
                Supports an existing 1-Year Plan goal
              </p>
            </label>
            <label
              className={cn(
                "flex gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors",
                form.isStrategicException
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              )}
            >
              <input
                type="radio"
                name="planType"
                checked={form.isStrategicException}
                onChange={() => set("isStrategicException", true)}
                className="mt-0.5 accent-orange-600 shrink-0"
              />
              <div>
                <p className="font-medium text-gray-900 text-sm">Strategic exception</p>
                <p className="text-gray-500 text-sm mt-0.5">
                  Makes a written case for revising the 1-Year Plan
                </p>
              </div>
            </label>
          </div>

          {!form.isStrategicException ? (
            oneYearGoals.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Which goal(s) does this support?</p>
                {oneYearGoals.map((goal) => (
                  <label
                    key={goal.id}
                    className={cn(
                      "flex gap-3 p-3.5 rounded-lg border-2 cursor-pointer transition-colors",
                      selectedGoals.includes(goal.description)
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selectedGoals.includes(goal.description)}
                      onChange={() => toggleGoal(goal.description)}
                      className="mt-0.5 accent-orange-600 shrink-0"
                    />
                    <span className="text-sm text-gray-800">{goal.description}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Which 1-Year Plan goal does this support?
                </label>
                <textarea
                  value={form.oneYearPlanGoal}
                  onChange={(e) => set("oneYearPlanGoal", e.target.value)}
                  rows={3}
                  placeholder="Point to at least one current 1-Year Plan goal…"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  autoFocus
                />
              </div>
            )
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Strategic Exception Case
              </label>
              <textarea
                value={form.strategicExceptionNote}
                onChange={(e) => set("strategicExceptionNote", e.target.value)}
                rows={4}
                placeholder="Make the written case for why this warrants revising the 1-Year Plan…"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                autoFocus
              />
            </div>
          )}
        </div>
      )}

      {/* Step 6: Distraction Risk + Review */}
      {step === 6 && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Distraction Risk & Review</h2>
            <p className="text-gray-500 text-sm mt-1">Final check before logging this project.</p>
          </div>

          <label
            className={cn(
              "flex gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors",
              form.noDistractionRisk
                ? "border-orange-500 bg-orange-50"
                : "border-gray-200 bg-white hover:border-gray-300"
            )}
          >
            <input
              type="checkbox"
              checked={form.noDistractionRisk}
              onChange={(e) => set("noDistractionRisk", e.target.checked)}
              className="mt-0.5 accent-orange-600 shrink-0"
            />
            <div>
              <p className="font-medium text-gray-900 text-sm">No Distraction Risk</p>
              <p className="text-gray-500 text-sm mt-0.5">
                Pursuing this initiative will not require abandoning an existing active Project.
              </p>
            </div>
          </label>

          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3.5 text-sm">
            <h3 className="font-semibold text-gray-700 text-xs uppercase tracking-wider">
              Summary
            </h3>
            <ReviewLine label="Project" value={form.name} />
            <ReviewLine label="Problem Statement" value={form.problemStatement} />
            <ReviewLine
              label="Core Focus"
              value="Mission alignment ✓ · Niche fit ✓ · 10-Year alignment ✓"
            />
            <ReviewLine
              label="Core Value"
              value={coreValues.length > 0 ? selectedValues.join(", ") : form.coreValueName}
            />
            <ReviewLine
              label={form.isStrategicException ? "Strategic Exception" : "1-Year Plan Goal"}
              value={
                form.isStrategicException
                  ? form.strategicExceptionNote
                  : oneYearGoals.length > 0
                  ? selectedGoals.join(", ")
                  : form.oneYearPlanGoal
              }
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}
        </div>
      )}

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between">
        {step > 1 ? (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            ← Back
          </button>
        ) : (
          <div />
        )}

        {step < STEPS.length ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canAdvance()}
            className="bg-orange-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Continue →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!canAdvance() || loading}
            className="bg-orange-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Submitting…" : "Log Project →"}
          </button>
        )}
      </div>
    </div>
  )
}

function ReviewLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</p>
      <p className="text-gray-800 mt-0.5">{value}</p>
    </div>
  )
}
