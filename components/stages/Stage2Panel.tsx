"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { saveStage2Draft, submitLeaderScore, advanceFromStage2 } from "@/app/actions/projects"
import {
  StepBar, StepNav, StepHeading, Field, TextInput, TextArea, CheckCard,
  StagePanelHeader, Section, cn,
} from "./shared"
import type { Stage2Data, Stage2Score } from "@prisma/client"

// ── Types ─────────────────────────────────────────────────────────────────────

type Leader = { id: string; name: string | null; email: string }

type ScoreWithUser = Stage2Score & { user: { name: string | null; email: string } }

type Stage2WithScores = Stage2Data & { scores: ScoreWithUser[] }

type DraftForm = {
  description: string
  expectedOutcome: string
  targetAudience: string
  oneTimeCost: string
  ongoingCost: string
  revenueOrSavings: string
  fundingSource: string
  staffHoursLaunch: string
  staffHoursSustain: string
  noStaffDisruption: boolean
  newStaffingNote: string
  spaceRequired: string
  equipmentRequired: string
  noResourceConflict: boolean
  estimatedLaunchDate: string
  isWithin90Days: boolean
}

type ScoreForm = {
  scoreStratAlignment: number
  scoreImpact: number
  scoreFeasibility: number
  scoreCompetency: number
  scoreRisk: number
  scoreTimeToImpact: number
}

// ── Constants ─────────────────────────────────────────────────────────────────

const FUNDING_OPTIONS = [
  { value: "EXISTING_BUDGET", label: "Existing budget line" },
  { value: "REALLOCATION", label: "Reallocation" },
  { value: "GRANT", label: "Grant" },
  { value: "FUNDRAISING", label: "Fundraising (flags a funding gap)" },
  { value: "DONOR_DIRECTED", label: "Donor-directed gift" },
  { value: "NOT_IDENTIFIED", label: "Not yet identified (flags a funding gap)" },
]

const SCORE_CRITERIA = [
  { key: "scoreStratAlignment" as const, label: "Strategic Alignment with V/TO 1-Year Plan", weight: 0.25 },
  { key: "scoreImpact" as const, label: "Revenue, Membership, or Mission Impact", weight: 0.20 },
  { key: "scoreFeasibility" as const, label: "Resource Feasibility (people, money, space)", weight: 0.20 },
  { key: "scoreCompetency" as const, label: "Core Competency Fit (within Make's niche)", weight: 0.15 },
  { key: "scoreRisk" as const, label: "Risk Level to Existing Operations (5 = low risk)", weight: 0.10 },
  { key: "scoreTimeToImpact" as const, label: "Time to Meaningful Impact", weight: 0.10 },
]

const EMPTY_DRAFT: DraftForm = {
  description: "", expectedOutcome: "", targetAudience: "",
  oneTimeCost: "", ongoingCost: "", revenueOrSavings: "", fundingSource: "",
  staffHoursLaunch: "", staffHoursSustain: "", noStaffDisruption: false, newStaffingNote: "",
  spaceRequired: "", equipmentRequired: "", noResourceConflict: false,
  estimatedLaunchDate: "", isWithin90Days: false,
}

const EMPTY_SCORE: ScoreForm = {
  scoreStratAlignment: 0, scoreImpact: 0, scoreFeasibility: 0,
  scoreCompetency: 0, scoreRisk: 0, scoreTimeToImpact: 0,
}

const DRAFT_STEPS = 5

// ── Helpers ───────────────────────────────────────────────────────────────────

function draftFromDb(d: Stage2Data): DraftForm {
  return {
    description: d.description, expectedOutcome: d.expectedOutcome, targetAudience: d.targetAudience,
    oneTimeCost: d.oneTimeCost, ongoingCost: d.ongoingCost, revenueOrSavings: d.revenueOrSavings,
    fundingSource: d.fundingSource,
    staffHoursLaunch: d.staffHoursLaunch, staffHoursSustain: d.staffHoursSustain,
    noStaffDisruption: d.noStaffDisruption, newStaffingNote: d.newStaffingNote ?? "",
    spaceRequired: d.spaceRequired, equipmentRequired: d.equipmentRequired,
    noResourceConflict: d.noResourceConflict,
    estimatedLaunchDate: d.estimatedLaunchDate, isWithin90Days: d.isWithin90Days,
  }
}

function scoreFromRecord(s: Stage2Score): ScoreForm {
  return {
    scoreStratAlignment: s.scoreStratAlignment, scoreImpact: s.scoreImpact,
    scoreFeasibility: s.scoreFeasibility, scoreCompetency: s.scoreCompetency,
    scoreRisk: s.scoreRisk, scoreTimeToImpact: s.scoreTimeToImpact,
  }
}

function calcWeighted(s: ScoreForm): number {
  return Math.round((
    s.scoreStratAlignment * 0.25 + s.scoreImpact * 0.2 + s.scoreFeasibility * 0.2 +
    s.scoreCompetency * 0.15 + s.scoreRisk * 0.1 + s.scoreTimeToImpact * 0.1
  ) * 100) / 100
}

function fmtDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Stage2Panel({
  projectId,
  data,
  currentStage,
  userId,
  userRole,
  leaders,
}: {
  projectId: string
  data: Stage2WithScores | null
  currentStage: number
  userId: string
  userRole: string
  leaders: Leader[]
}) {
  const router = useRouter()

  const isLeader = userRole === "LEADERSHIP" || userRole === "ADMIN"
  const myScore = data?.scores.find((s) => s.userId === userId) ?? null
  // All leaders have scored once completedAt is set — use both signals
  const allScored = !!data?.completedAt && data.scores.length >= leaders.length

  const [expanded, setExpanded] = useState(false)
  const [showInfoForm, setShowInfoForm] = useState(!data)
  const [infoStep, setInfoStep] = useState(1)
  const [draft, setDraft] = useState<DraftForm>(data ? draftFromDb(data) : EMPTY_DRAFT)
  const [savingDraft, setSavingDraft] = useState(false)

  const [showScoreForm, setShowScoreForm] = useState(isLeader && !myScore)
  const [scoreForm, setScoreForm] = useState<ScoreForm>(myScore ? scoreFromRecord(myScore) : EMPTY_SCORE)
  const [savingScore, setSavingScore] = useState(false)

  const [advancing, setAdvancing] = useState(false)

  function setDraftField<K extends keyof DraftForm>(k: K, v: DraftForm[K]) {
    setDraft((p) => ({ ...p, [k]: v }))
  }

  function draftCanAdvance(): boolean {
    switch (infoStep) {
      case 1: return !!draft.description && !!draft.expectedOutcome && !!draft.targetAudience
      case 2: return !!draft.oneTimeCost && !!draft.ongoingCost && !!draft.revenueOrSavings && !!draft.fundingSource
      case 3: return !!draft.staffHoursLaunch && !!draft.staffHoursSustain && draft.noStaffDisruption
      case 4: return !!draft.spaceRequired && !!draft.equipmentRequired && draft.noResourceConflict
      case 5: return !!draft.estimatedLaunchDate
      default: return false
    }
  }

  async function handleSaveDraft() {
    setSavingDraft(true)
    try {
      await saveStage2Draft(projectId, draft)
      setShowInfoForm(false)
      setInfoStep(1)
      router.refresh()
    } catch {
      setSavingDraft(false)
    }
  }

  async function handleSubmitScore() {
    if (SCORE_CRITERIA.some((c) => scoreForm[c.key] === 0)) return
    setSavingScore(true)
    try {
      await submitLeaderScore(projectId, scoreForm)
      setShowScoreForm(false)
      router.refresh()
    } catch {
      setSavingScore(false)
    }
  }

  async function handleAdvance() {
    setAdvancing(true)
    try {
      await advanceFromStage2(projectId)
    } catch {
      setAdvancing(false)
    }
  }

  // ── Locked ──
  if (currentStage < 2) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 mb-4 overflow-hidden opacity-50">
        <StagePanelHeader stageNum={2} title="Scope and Resources" state="locked" />
      </div>
    )
  }

  // ── Completed ──
  if (currentStage > 2) {
    const score = data?.scoreTotal ?? 0
    return (
      <div className="bg-white rounded-xl border border-gray-200 mb-4 overflow-hidden">
        <StagePanelHeader
          stageNum={2} title="Scope and Resources" state="completed"
          completedAt={data?.completedAt} isExpanded={expanded}
          onToggle={() => setExpanded((e) => !e)}
        />
        {expanded && data && (
          <div className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">
            <Section label="Description">{data.description}</Section>
            <Section label="Expected Outcome">{data.expectedOutcome}</Section>
            <Section label="Financial">
              <p className="text-sm text-gray-700">One-time: {data.oneTimeCost} · Ongoing: {data.ongoingCost} · Revenue/savings: {data.revenueOrSavings}</p>
              <p className="text-sm text-gray-500 mt-0.5">Funding: {FUNDING_OPTIONS.find((o) => o.value === data.fundingSource)?.label}</p>
            </Section>
            <Section label="Timeline">
              <p className="text-sm text-gray-700">{fmtDate(data.estimatedLaunchDate)}</p>
            </Section>
            <Section label="Scoring">
              <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold", score >= 3.5 ? "bg-green-50 text-green-700" : score >= 2.5 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700")}>
                Score: {score.toFixed(2)} / 5.0 · {data.scores.length} leader{data.scores.length !== 1 ? "s" : ""} scored
              </div>
            </Section>
          </div>
        )}
      </div>
    )
  }

  // ── Active ──────────────────────────────────────────────────────────────────

  const aggregateScore = data?.scoreTotal ?? 0

  return (
    <div className="bg-white rounded-xl border border-orange-200 mb-4 overflow-hidden">
      <StagePanelHeader stageNum={2} title="Scope and Resources" state="active" />

      {/* ── Info Section ── */}
      <div className="px-5 pt-5 pb-4 border-t border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Initiative Information
          </p>
          {data && !showInfoForm && (
            <button onClick={() => setShowInfoForm(true)} className="text-xs text-orange-600 hover:underline">
              Edit
            </button>
          )}
        </div>

        {showInfoForm ? (
          <>
            <StepBar total={DRAFT_STEPS} current={infoStep} />

            {infoStep === 1 && (
              <div className="space-y-4">
                <StepHeading title="Initiative Definition" subtitle="Describe what will be built, launched, or delivered." />
                <Field label="Description (2–4 sentences)">
                  <TextArea value={draft.description} onChange={(v) => setDraftField("description", v)} placeholder="Describe the initiative…" autoFocus />
                </Field>
                <Field label="Expected Outcome">
                  <TextArea value={draft.expectedOutcome} onChange={(v) => setDraftField("expectedOutcome", v)} placeholder="What will be measurably true when this is complete?" rows={3} />
                </Field>
                <Field label="Target Audience">
                  <TextInput value={draft.targetAudience} onChange={(v) => setDraftField("targetAudience", v)} placeholder="e.g. Current members who use the laser cutter" />
                </Field>
              </div>
            )}

            {infoStep === 2 && (
              <div className="space-y-4">
                <StepHeading title="Financial Scope" />
                <Field label="Estimated one-time cost">
                  <TextInput value={draft.oneTimeCost} onChange={(v) => setDraftField("oneTimeCost", v)} placeholder="e.g. $2,500 for equipment" autoFocus />
                </Field>
                <Field label="Estimated ongoing cost">
                  <TextInput value={draft.ongoingCost} onChange={(v) => setDraftField("ongoingCost", v)} placeholder="e.g. $150/month materials" />
                </Field>
                <Field label="Estimated revenue or savings">
                  <TextInput value={draft.revenueOrSavings} onChange={(v) => setDraftField("revenueOrSavings", v)} placeholder="e.g. +$400/month" />
                </Field>
                <Field label="Funding source">
                  <div className="space-y-2 mt-1">
                    {FUNDING_OPTIONS.map((o) => (
                      <label key={o.value} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer text-sm transition-colors", draft.fundingSource === o.value ? "border-orange-500 bg-orange-50 text-orange-800 font-medium" : "border-gray-200 hover:border-gray-300 text-gray-700")}>
                        <input type="radio" name="funding" value={o.value} checked={draft.fundingSource === o.value} onChange={() => setDraftField("fundingSource", o.value)} className="accent-orange-600" />
                        {o.label}
                      </label>
                    ))}
                  </div>
                </Field>
              </div>
            )}

            {infoStep === 3 && (
              <div className="space-y-4">
                <StepHeading title="Staffing and Time" />
                <Field label="Staff hours per week to launch">
                  <TextInput value={draft.staffHoursLaunch} onChange={(v) => setDraftField("staffHoursLaunch", v)} placeholder="e.g. 5 hrs/week" autoFocus />
                </Field>
                <Field label="Staff hours per week to sustain">
                  <TextInput value={draft.staffHoursSustain} onChange={(v) => setDraftField("staffHoursSustain", v)} placeholder="e.g. 2 hrs/week" />
                </Field>
                <CheckCard checked={draft.noStaffDisruption} onChange={(v) => setDraftField("noStaffDisruption", v)} title="No staff disruption" description="No current staff member's primary projects are materially disrupted." />
                <Field label="New staffing note (if applicable)">
                  <TextArea value={draft.newStaffingNote} onChange={(v) => setDraftField("newStaffingNote", v)} placeholder="Leave blank if no new staffing required." rows={2} />
                </Field>
              </div>
            )}

            {infoStep === 4 && (
              <div className="space-y-4">
                <StepHeading title="Space and Equipment" />
                <Field label="Physical space required">
                  <TextInput value={draft.spaceRequired} onChange={(v) => setDraftField("spaceRequired", v)} placeholder="e.g. 200 sq ft in fab lab, or 'no space needed'" autoFocus />
                </Field>
                <Field label="Equipment or tools required">
                  <TextInput value={draft.equipmentRequired} onChange={(v) => setDraftField("equipmentRequired", v)} placeholder="e.g. Existing laser cutter, or 'Purchase: Epilog $8k'" />
                </Field>
                <CheckCard checked={draft.noResourceConflict} onChange={(v) => setDraftField("noResourceConflict", v)} title="No resource conflict" description="Space/equipment use does not conflict with existing member access or programs." />
              </div>
            )}

            {infoStep === 5 && (
              <div className="space-y-4">
                <StepHeading title="Timeline" subtitle="Select a launch date within the next 90 days." />
                <Field label="Estimated launch date">
                  <input
                    type="date"
                    value={draft.estimatedLaunchDate}
                    min={(() => { const d = new Date(); return d.toISOString().split("T")[0] })()}
                    max={(() => { const d = new Date(); d.setDate(d.getDate() + 90); return d.toISOString().split("T")[0] })()}
                    onChange={(e) => {
                      setDraftField("estimatedLaunchDate", e.target.value)
                      setDraftField("isWithin90Days", true)
                    }}
                    autoFocus
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </Field>
              </div>
            )}

            <StepNav
              step={infoStep} total={DRAFT_STEPS} canNext={draftCanAdvance()} loading={savingDraft}
              onBack={() => setInfoStep((s) => s - 1)} onNext={() => setInfoStep((s) => s + 1)}
              onSubmit={handleSaveDraft} submitLabel="Save Information →"
            />
          </>
        ) : data ? (
          <div className="space-y-2 text-sm text-gray-600">
            <p><span className="font-medium text-gray-700">Description:</span> {data.description}</p>
            <p><span className="font-medium text-gray-700">Outcome:</span> {data.expectedOutcome}</p>
            <p><span className="font-medium text-gray-700">Launch:</span> {fmtDate(data.estimatedLaunchDate)} · {FUNDING_OPTIONS.find((o) => o.value === data.fundingSource)?.label ?? data.fundingSource}</p>
          </div>
        ) : null}
      </div>

      {/* ── Scoring Section (only shown after draft is saved) ── */}
      {data && !showInfoForm && (
        <div className="px-5 pb-5 border-t border-gray-200 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
            Leadership Scoring
          </p>

          {leaders.length === 0 ? (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              No leaders configured. Go to Settings → Team Members and assign at least one Leadership or Admin role.
            </p>
          ) : (
            <>
              {/* Score result (when all scored) */}
              {allScored && (
                <div className={cn(
                  "p-3 rounded-lg text-sm font-semibold mb-4",
                  aggregateScore >= 3.5 ? "bg-green-50 text-green-700 border border-green-200"
                    : aggregateScore >= 2.5 ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                )}>
                  Aggregate Score: {aggregateScore.toFixed(2)} / 5.0 —{" "}
                  {aggregateScore >= 3.5 ? "Qualifies" : aggregateScore >= 2.5 ? "Needs Revision" : "Does Not Qualify — Parked"}
                </div>
              )}

              {/* Leader: my scoring form */}
              {isLeader && (
                <div className="mb-4">
                  {showScoreForm ? (
                    <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-4">
                      <p className="text-sm font-semibold text-gray-700">
                        {myScore ? "Revise Your Scores" : "Submit Your Scores"}
                      </p>
                      <p className="text-xs text-gray-500">Score each criterion 1–5. Weighted average of 3.5+ required to advance.</p>
                      {SCORE_CRITERIA.map((c) => (
                        <div key={c.key}>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-sm font-medium text-gray-700">{c.label}</label>
                            <span className="text-xs text-gray-400">{Math.round(c.weight * 100)}%</span>
                          </div>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <button key={n} type="button" onClick={() => setScoreForm((p) => ({ ...p, [c.key]: n }))}
                                className={cn("w-10 h-10 rounded-lg border-2 text-sm font-semibold transition-colors",
                                  scoreForm[c.key] === n ? "border-orange-500 bg-orange-500 text-white" : "border-gray-200 text-gray-500 hover:border-orange-300"
                                )}>
                                {n}
                              </button>
                            ))}
                            {scoreForm[c.key] > 0 && (
                              <span className="self-center text-xs text-gray-400 ml-1">→ {(scoreForm[c.key] * c.weight).toFixed(2)}</span>
                            )}
                          </div>
                        </div>
                      ))}
                      {SCORE_CRITERIA.every((c) => scoreForm[c.key] > 0) && (
                        <div className={cn("p-2.5 rounded-lg text-sm font-semibold text-center", calcWeighted(scoreForm) >= 3.5 ? "bg-green-50 text-green-700" : calcWeighted(scoreForm) >= 2.5 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700")}>
                          My weighted score: {calcWeighted(scoreForm).toFixed(2)}
                        </div>
                      )}
                      <div className="flex gap-2 pt-1">
                        <button onClick={handleSubmitScore} disabled={SCORE_CRITERIA.some((c) => scoreForm[c.key] === 0) || savingScore}
                          className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-40 transition-colors">
                          {savingScore ? "Submitting…" : "Submit My Scores"}
                        </button>
                        {myScore && (
                          <button onClick={() => setShowScoreForm(false)} className="text-sm text-gray-500 hover:text-gray-700 px-3">
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ) : myScore ? (
                    <div className="flex items-center justify-between px-4 py-3 bg-green-50 border border-green-200 rounded-lg mb-2">
                      <div>
                        <p className="text-sm font-semibold text-green-700">Your score submitted</p>
                        {allScored && (
                          <p className="text-xs text-green-600 mt-0.5">Weighted: {calcWeighted(scoreFromRecord(myScore)).toFixed(2)}</p>
                        )}
                      </div>
                      <button onClick={() => setShowScoreForm(true)} className="text-xs text-orange-600 hover:underline">Revise</button>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Staff: waiting message */}
              {!isLeader && (
                <p className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 mb-4">
                  Awaiting leadership scoring — {data.scores.length} of {leaders.length} leader{leaders.length !== 1 ? "s" : ""} have scored.
                </p>
              )}

              {/* Scorer progress list */}
              <div className="space-y-1.5 mb-4">
                {leaders.map((leader) => {
                  const s = data.scores.find((sc) => sc.userId === leader.id)
                  const displayName = leader.name ?? leader.email
                  return (
                    <div key={leader.id} className={cn("flex items-center justify-between px-3 py-2 rounded-lg text-sm", s ? "bg-green-50 text-green-800" : "bg-gray-50 text-gray-500")}>
                      <div className="flex items-center gap-2">
                        <span className={cn("w-2 h-2 rounded-full", s ? "bg-green-500" : "bg-gray-300")} />
                        <span>{displayName}</span>
                      </div>
                      {s ? (
                        allScored
                          ? <span className="text-xs font-semibold">{calcWeighted(scoreFromRecord(s)).toFixed(2)}</span>
                          : <span className="text-xs text-green-600 font-medium">Scored</span>
                      ) : (
                        <span className="text-xs text-gray-400">Pending</span>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Advance button */}
              {allScored && isLeader && aggregateScore >= 3.5 && (
                <button onClick={handleAdvance} disabled={advancing}
                  className="w-full bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-40 transition-colors">
                  {advancing ? "Advancing…" : "Advance to Stage 3 →"}
                </button>
              )}

              {/* Needs revision message for leaders */}
              {allScored && isLeader && aggregateScore >= 2.5 && aggregateScore < 3.5 && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  Score 2.5–3.4: return for IDS discussion. Revise your score above after specific gaps are addressed.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
