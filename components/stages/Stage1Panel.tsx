"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { StagePanelHeader, Section, CheckRow } from "./shared"
import { updateStage1 } from "@/app/actions/projects"
import { cn } from "@/lib/utils"
import type { Stage1Data } from "@prisma/client"

type CoreValue = { id: string; name: string }
type Goal = { id: string; title: string; order: number }
type YearPlan = { id: string; title: string; pillarTitle: string; goals: Goal[] }

export function Stage1Panel({
  data,
  goalTitle,
  userRole,
  projectId,
  projectName,
  coreValues = [],
  yearPlans = [],
  mission = "",
  tenYearTarget = "",
}: {
  data: Stage1Data
  goalTitle?: string
  userRole: string
  projectId: string
  projectName: string
  coreValues?: CoreValue[]
  yearPlans?: YearPlan[]
  mission?: string
  tenYearTarget?: string
}) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const allGoals = yearPlans.flatMap((p) => p.goals.map((g) => ({ ...g, planTitle: p.title })))

  const [form, setForm] = useState({
    projectName,
    problemStatement: data.problemStatement,
    missionAlignment: data.missionAlignment,
    nicheFit: data.nicheFit,
    tenYearAlignment: data.tenYearAlignment,
    coreValueName: data.coreValueName,
    noCoreValueViolated: data.noCoreValueViolated,
    goalId: data.goalId ?? "",
    isStrategicException: data.isStrategicException,
    strategicExceptionNote: data.strategicExceptionNote ?? "",
    noDistractionRisk: data.noDistractionRisk,
  })

  const [selectedValues, setSelectedValues] = useState<string[]>(
    data.coreValueName ? data.coreValueName.split(", ").filter(Boolean) : []
  )

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function toggleValue(name: string) {
    setSelectedValues((prev) =>
      prev.includes(name) ? prev.filter((v) => v !== name) : [...prev, name]
    )
  }

  async function handleSave() {
    setSaving(true)
    setError("")
    const resolvedCoreValueName =
      coreValues.length > 0 ? selectedValues.join(", ") : form.coreValueName

    const result = await updateStage1(projectId, form.projectName, {
      problemStatement: form.problemStatement,
      missionAlignment: form.missionAlignment,
      nicheFit: form.nicheFit,
      tenYearAlignment: form.tenYearAlignment,
      coreValueName: resolvedCoreValueName,
      noCoreValueViolated: form.noCoreValueViolated,
      goalId: form.goalId || null,
      isStrategicException: form.isStrategicException,
      strategicExceptionNote: form.strategicExceptionNote,
      noDistractionRisk: form.noDistractionRisk,
    })

    if (result?.error) {
      setError(result.error)
      setSaving(false)
      return
    }

    setSaving(false)
    setEditing(false)
    router.refresh()
  }

  const isAdmin = userRole === "ADMIN"

  return (
    <div className="bg-white rounded-xl border border-gray-200 mb-4 overflow-hidden">
      <StagePanelHeader
        stageNum={1}
        title="Pitch and Propose"
        state="completed"
        completedAt={data.completedAt}
        isExpanded={expanded || editing}
        onToggle={() => {
          if (editing) return
          setExpanded((e) => !e)
        }}
      />

      {/* Read view */}
      {!editing && expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">
          <Section label="Problem / Opportunity Statement">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{data.problemStatement}</p>
          </Section>
          <Section label="Core Focus Filter">
            <div className="space-y-1.5">
              <CheckRow checked={data.missionAlignment} label="Mission alignment" />
              <CheckRow checked={data.nicheFit} label="Niche fit" />
              <CheckRow checked={data.tenYearAlignment} label="10-Year Target alignment" />
            </div>
          </Section>
          <Section label="Core Values">
            <CheckRow
              checked={data.noCoreValueViolated}
              label={`Embodies "${data.coreValueName}" · No Core Value violated`}
            />
          </Section>
          <Section label="1-Year Plan Relevance">
            {data.isStrategicException ? (
              <div>
                <span className="inline-block text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-medium mb-1.5">
                  Strategic Exception
                </span>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{data.strategicExceptionNote}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {goalTitle ?? data.oneYearPlanGoal}
              </p>
            )}
          </Section>
          <Section label="Distraction Risk">
            <CheckRow checked={data.noDistractionRisk} label="No existing projects will be abandoned" />
          </Section>

          {isAdmin && (
            <div className="pt-2 border-t border-gray-100">
              <button
                onClick={() => setEditing(true)}
                className="text-xs text-gray-400 hover:text-orange-600 transition-colors font-medium"
              >
                Edit Stage 1 →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Edit view */}
      {editing && (
        <div className="px-5 pb-5 space-y-5 border-t border-gray-100 pt-4">
          {/* Project name */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Project Name
            </label>
            <input
              type="text"
              value={form.projectName}
              onChange={(e) => set("projectName", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Problem statement */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Problem / Opportunity Statement
            </label>
            <textarea
              value={form.problemStatement}
              onChange={(e) => set("problemStatement", e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
          </div>

          {/* Core Focus Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Core Focus Filter
            </label>
            <div className="space-y-2">
              {[
                { key: "missionAlignment" as const, label: "Mission Alignment", note: mission },
                { key: "nicheFit" as const, label: "Niche Fit", note: "" },
                { key: "tenYearAlignment" as const, label: "10-Year Target Alignment", note: tenYearTarget },
              ].map(({ key, label, note }) => (
                <label
                  key={key}
                  className={cn(
                    "flex gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors",
                    form[key] ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={form[key]}
                    onChange={(e) => set(key, e.target.checked)}
                    className="mt-0.5 accent-orange-600 shrink-0"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{label}</p>
                    {note && <p className="text-xs text-gray-500 mt-0.5">{note}</p>}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Core Values */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Core Values
            </label>
            {coreValues.length > 0 ? (
              <div className="space-y-2">
                {coreValues.map((cv) => (
                  <label
                    key={cv.id}
                    className={cn(
                      "flex gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors",
                      selectedValues.includes(cv.name)
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200 hover:border-gray-300"
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
              <input
                type="text"
                value={form.coreValueName}
                onChange={(e) => set("coreValueName", e.target.value)}
                placeholder="e.g. Access, Community"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            )}
            <label
              className={cn(
                "flex gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors mt-2",
                form.noCoreValueViolated ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-gray-300"
              )}
            >
              <input
                type="checkbox"
                checked={form.noCoreValueViolated}
                onChange={(e) => set("noCoreValueViolated", e.target.checked)}
                className="mt-0.5 accent-orange-600 shrink-0"
              />
              <span className="text-sm font-medium text-gray-900">No Core Value violated</span>
            </label>
          </div>

          {/* 1-Year Plan */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              1-Year Plan Relevance
            </label>
            <div className="space-y-2 mb-3">
              <label
                className={cn(
                  "flex gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors",
                  !form.isStrategicException ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-gray-300"
                )}
              >
                <input
                  type="radio"
                  checked={!form.isStrategicException}
                  onChange={() => set("isStrategicException", false)}
                  className="mt-0.5 accent-orange-600 shrink-0"
                />
                <span className="text-sm font-medium text-gray-900">Supports an existing 1-Year Plan goal</span>
              </label>
              <label
                className={cn(
                  "flex gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors",
                  form.isStrategicException ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-gray-300"
                )}
              >
                <input
                  type="radio"
                  checked={form.isStrategicException}
                  onChange={() => set("isStrategicException", true)}
                  className="mt-0.5 accent-orange-600 shrink-0"
                />
                <span className="text-sm font-medium text-gray-900">Strategic exception</span>
              </label>
            </div>

            {!form.isStrategicException ? (
              allGoals.length > 0 ? (
                <select
                  value={form.goalId}
                  onChange={(e) => set("goalId", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select a goal…</option>
                  {yearPlans.map((plan) => (
                    <optgroup key={plan.id} label={plan.pillarTitle}>
                      {plan.goals.map((goal) => (
                        <option key={goal.id} value={goal.id}>
                          {goal.order}. {goal.title}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-gray-400 italic">No goals set up yet — add them in Settings.</p>
              )
            ) : (
              <textarea
                value={form.strategicExceptionNote}
                onChange={(e) => set("strategicExceptionNote", e.target.value)}
                rows={3}
                placeholder="Make the case for why this warrants revising the 1-Year Plan…"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
            )}
          </div>

          {/* Distraction Risk */}
          <div>
            <label
              className={cn(
                "flex gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors",
                form.noDistractionRisk ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-gray-300"
              )}
            >
              <input
                type="checkbox"
                checked={form.noDistractionRisk}
                onChange={(e) => set("noDistractionRisk", e.target.checked)}
                className="mt-0.5 accent-orange-600 shrink-0"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">No Distraction Risk</p>
                <p className="text-xs text-gray-500 mt-0.5">No existing projects will be abandoned</p>
              </div>
            </label>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-40 transition-colors"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
