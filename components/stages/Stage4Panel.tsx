"use client"

import { useState } from "react"
import { addWeeklyUpdate, completeStage4 } from "@/app/actions/projects"
import { StagePanelHeader, Section, Field, TextInput, TextArea, CheckCard } from "./shared"
import type { Stage4Data, WeeklyUpdate } from "@prisma/client"

type Stage4WithUpdates = Stage4Data & { weeklyUpdates: WeeklyUpdate[] }

function currentWeekOf() {
  const d = new Date()
  d.setDate(d.getDate() - d.getDay() + 1)
  return d.toISOString().split("T")[0]
}

function formatWeekOf(w: string) {
  return new Date(w + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export function Stage4Panel({
  projectId,
  data,
  currentStage,
  month1Metric,
  month2Metric,
  month3Metric,
  userRole,
}: {
  projectId: string
  data: Stage4WithUpdates | null
  currentStage: number
  month1Metric?: string
  month2Metric?: string
  month3Metric?: string
  userRole: string
}) {
  const isLeader = userRole === "LEADERSHIP" || userRole === "ADMIN"
  const monthMetrics = [month1Metric, month2Metric, month3Metric].filter(Boolean) as string[]
  const isLocked = currentStage < 4
  const isCompleted = currentStage > 4
  const [expanded, setExpanded] = useState(false)
  const [showCheckin, setShowCheckin] = useState(false)
  const [showComplete, setShowComplete] = useState(false)
  const [loadingCheckin, setLoadingCheckin] = useState(false)
  const [loadingComplete, setLoadingComplete] = useState(false)

  const [weekOf, setWeekOf] = useState(currentWeekOf())
  const [status, setStatus] = useState<"ON_TRACK" | "OFF_TRACK">("ON_TRACK")
  const [notes, setNotes] = useState("")
  const [todoItem, setTodoItem] = useState("")
  const [metricValue, setMetricValue] = useState("")
  const [issues, setIssues] = useState("")
  const [completionReport, setCompletionReport] = useState("")

  const latestUpdate = data?.weeklyUpdates.slice(-1)[0]
  const isOffTrack = latestUpdate?.status === "OFF_TRACK"

  async function handleCheckin() {
    if (!data) return
    setLoadingCheckin(true)
    try {
      await addWeeklyUpdate(projectId, {
        stage4Id: data.id, weekOf, status, notes, todoItem, metricValue, issues,
      })
    } catch {
      setLoadingCheckin(false)
    }
  }

  async function handleComplete() {
    if (!completionReport.trim()) return
    setLoadingComplete(true)
    try {
      await completeStage4(projectId, completionReport)
    } catch {
      setLoadingComplete(false)
    }
  }

  if (isLocked) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 mb-4 overflow-hidden opacity-50">
        <StagePanelHeader stageNum={4} title="Execution" state="locked" />
      </div>
    )
  }

  if (isCompleted) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 mb-4 overflow-hidden">
        <StagePanelHeader
          stageNum={4} title="Execution" state="completed"
          completedAt={data?.completedAt} isExpanded={expanded}
          onToggle={() => setExpanded((e) => !e)}
        />
        {expanded && data && (
          <div className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">
            <Section label="Completion Report">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{data.completionReport}</p>
            </Section>
            <Section label={`Weekly Check-ins (${data.weeklyUpdates.length})`}>
              <div className="space-y-2">
                {data.weeklyUpdates.map((u) => (
                  <WeekRow key={u.id} update={u} />
                ))}
              </div>
            </Section>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-orange-200 mb-4 overflow-hidden">
      <StagePanelHeader stageNum={4} title="Execution" state="active" />
      <div className="px-5 pb-5 border-t border-gray-100 pt-5">

        {/* Status summary */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-sm font-medium text-gray-700">
              {data?.weeklyUpdates.length ?? 0} weekly check-in{data?.weeklyUpdates.length !== 1 ? "s" : ""} logged
            </p>
            {latestUpdate && (
              <p className={`text-xs mt-0.5 font-semibold ${isOffTrack ? "text-red-600" : "text-green-600"}`}>
                Latest: {isOffTrack ? "⚠ Off Track" : "✓ On Track"} — week of {formatWeekOf(latestUpdate.weekOf)}
              </p>
            )}
            {monthMetrics.length > 0 && (
              <div className="mt-1 space-y-0.5">
                {monthMetrics.map((m, i) => (
                  <p key={i} className="text-xs text-gray-400">Month {i + 1}: {m}</p>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => { setShowCheckin((s) => !s); setShowComplete(false) }}
            className="bg-orange-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-orange-700 transition-colors"
          >
            + Add Check-in
          </button>
        </div>

        {/* Add check-in form */}
        {showCheckin && (
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 mb-5 space-y-3">
            <p className="text-sm font-semibold text-gray-700">Weekly Check-in</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Week of">
                <input
                  type="date"
                  value={weekOf}
                  onChange={(e) => setWeekOf(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </Field>
              <Field label="Status">
                <div className="flex gap-2 mt-0.5">
                  {(["ON_TRACK", "OFF_TRACK"] as const).map((s) => (
                    <label key={s} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border-2 cursor-pointer text-xs font-semibold transition-colors ${status === s ? (s === "ON_TRACK" ? "border-green-500 bg-green-50 text-green-700" : "border-red-500 bg-red-50 text-red-700") : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                      <input type="radio" name="status" value={s} checked={status === s} onChange={() => setStatus(s)} className="sr-only" />
                      {s === "ON_TRACK" ? "✓ On Track" : "⚠ Off Track"}
                    </label>
                  ))}
                </div>
              </Field>
            </div>
            {monthMetrics.length > 0 && (
              <Field label="Metric value this week">
                <TextInput value={metricValue} onChange={setMetricValue} placeholder="Enter this week's metric value" />
              </Field>
            )}
            <Field label="This week's to-do (7-day action)">
              <TextInput value={todoItem} onChange={setTodoItem} placeholder="One concrete to-do for the coming week" />
            </Field>
            <Field label="Notes (optional)">
              <TextArea value={notes} onChange={setNotes} placeholder="Any context on progress…" rows={2} />
            </Field>
            <Field label="Issues to log (optional)">
              <TextArea value={issues} onChange={setIssues} placeholder="Blockers, dependencies, risks surfaced this week…" rows={2} />
            </Field>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleCheckin}
                disabled={!todoItem || loadingCheckin}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-40 transition-colors"
              >
                {loadingCheckin ? "Saving…" : "Save Check-in"}
              </button>
              <button onClick={() => setShowCheckin(false)} className="text-sm text-gray-500 hover:text-gray-700 px-3">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Weekly updates list */}
        {data && data.weeklyUpdates.length > 0 && (
          <div className="space-y-2 mb-5">
            {[...data.weeklyUpdates].reverse().map((u) => (
              <WeekRow key={u.id} update={u} />
            ))}
          </div>
        )}

        {data && data.weeklyUpdates.length === 0 && !showCheckin && (
          <p className="text-sm text-gray-400 mb-5 text-center py-4 border border-dashed border-gray-200 rounded-lg">
            No check-ins yet. Add the first weekly update above.
          </p>
        )}

        {/* Complete stage 4 — leadership only */}
        {isLeader && <div className="border-t border-gray-100 pt-4">
          <button
            onClick={() => { setShowComplete((s) => !s); setShowCheckin(false) }}
            className="text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            {showComplete ? "▲ Cancel" : "▼ Close Out Stage 4"}
          </button>
          {showComplete && (
            <div className="mt-3 space-y-3">
              <p className="text-xs text-gray-500">
                Definition of Done criteria must be fully met. Write a one-paragraph completion report, then advance to Stage 5.
              </p>
              <Field label="Completion Report">
                <TextArea
                  value={completionReport}
                  onChange={setCompletionReport}
                  placeholder="Summarize what was accomplished, whether DoD criteria were met, and any final notes…"
                  rows={4}
                />
              </Field>
              <button
                onClick={handleComplete}
                disabled={!completionReport.trim() || loadingComplete}
                className="bg-orange-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-40 transition-colors"
              >
                {loadingComplete ? "Saving…" : "Complete Stage 4 → Advance to Stage 5"}
              </button>
            </div>
          )}
        </div>}
      </div>
    </div>
  )
}

function WeekRow({ update }: { update: WeeklyUpdate }) {
  const isOff = update.status === "OFF_TRACK"
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${isOff ? "border-red-200 bg-red-50" : "border-green-100 bg-green-50"}`}>
      <div className="flex items-center justify-between">
        <span className="font-medium text-gray-700">Week of {formatWeekOf(update.weekOf)}</span>
        <span className={`text-xs font-semibold ${isOff ? "text-red-600" : "text-green-600"}`}>
          {isOff ? "⚠ Off Track" : "✓ On Track"}
        </span>
      </div>
      {update.metricValue && <p className="text-gray-600 mt-1">Metric: {update.metricValue}</p>}
      {update.todoItem && <p className="text-gray-600 mt-0.5">To-do: {update.todoItem}</p>}
      {update.notes && <p className="text-gray-500 mt-0.5 text-xs">{update.notes}</p>}
      {update.issues && <p className="text-red-600 mt-0.5 text-xs">Issues: {update.issues}</p>}
    </div>
  )
}
