"use client"

import { useState } from "react"
import { saveStage2 } from "@/app/actions/projects"
import {
  StepBar, StepNav, StepHeading, Field, TextInput, TextArea, CheckCard,
  StagePanelHeader, Section, CheckRow, cn,
} from "./shared"
import type { Stage2Data } from "@prisma/client"

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

type FormData = {
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
  quarterlyMilestones: string
  scoreStratAlignment: number
  scoreImpact: number
  scoreFeasibility: number
  scoreCompetency: number
  scoreRisk: number
  scoreTimeToImpact: number
}

const EMPTY: FormData = {
  description: "", expectedOutcome: "", targetAudience: "",
  oneTimeCost: "", ongoingCost: "", revenueOrSavings: "", fundingSource: "",
  staffHoursLaunch: "", staffHoursSustain: "", noStaffDisruption: false, newStaffingNote: "",
  spaceRequired: "", equipmentRequired: "", noResourceConflict: false,
  estimatedLaunchDate: "", isWithin90Days: false, quarterlyMilestones: "",
  scoreStratAlignment: 0, scoreImpact: 0, scoreFeasibility: 0,
  scoreCompetency: 0, scoreRisk: 0, scoreTimeToImpact: 0,
}

function fromDb(d: Stage2Data): FormData {
  return {
    description: d.description, expectedOutcome: d.expectedOutcome, targetAudience: d.targetAudience,
    oneTimeCost: d.oneTimeCost, ongoingCost: d.ongoingCost, revenueOrSavings: d.revenueOrSavings,
    fundingSource: d.fundingSource,
    staffHoursLaunch: d.staffHoursLaunch, staffHoursSustain: d.staffHoursSustain,
    noStaffDisruption: d.noStaffDisruption, newStaffingNote: d.newStaffingNote ?? "",
    spaceRequired: d.spaceRequired, equipmentRequired: d.equipmentRequired,
    noResourceConflict: d.noResourceConflict,
    estimatedLaunchDate: d.estimatedLaunchDate, isWithin90Days: d.isWithin90Days,
    quarterlyMilestones: d.quarterlyMilestones ?? "",
    scoreStratAlignment: d.scoreStratAlignment, scoreImpact: d.scoreImpact,
    scoreFeasibility: d.scoreFeasibility, scoreCompetency: d.scoreCompetency,
    scoreRisk: d.scoreRisk, scoreTimeToImpact: d.scoreTimeToImpact,
  }
}

function calcWeighted(f: FormData) {
  return Math.round((
    f.scoreStratAlignment * 0.25 + f.scoreImpact * 0.2 + f.scoreFeasibility * 0.2 +
    f.scoreCompetency * 0.15 + f.scoreRisk * 0.1 + f.scoreTimeToImpact * 0.1
  ) * 100) / 100
}

const TOTAL_STEPS = 7

export function Stage2Panel({
  projectId,
  data,
  currentStage,
}: {
  projectId: string
  data: Stage2Data | null
  currentStage: number
}) {
  const isLocked = currentStage < 2
  const isCompleted = currentStage > 2
  const isActive = currentStage === 2

  const [expanded, setExpanded] = useState(false)
  const [isRevising, setIsRevising] = useState(false)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<FormData>(data ? fromDb(data) : EMPTY)

  function set<K extends keyof FormData>(k: K, v: FormData[K]) {
    setForm((p) => ({ ...p, [k]: v }))
  }

  function canAdvance(): boolean {
    switch (step) {
      case 1: return !!form.description && !!form.expectedOutcome && !!form.targetAudience
      case 2: return !!form.oneTimeCost && !!form.ongoingCost && !!form.revenueOrSavings && !!form.fundingSource
      case 3: return !!form.staffHoursLaunch && !!form.staffHoursSustain && form.noStaffDisruption
      case 4: return !!form.spaceRequired && !!form.equipmentRequired && form.noResourceConflict
      case 5: return !!form.estimatedLaunchDate && (form.isWithin90Days || !!form.quarterlyMilestones)
      case 6: return SCORE_CRITERIA.every((c) => form[c.key] > 0)
      case 7: return true
      default: return false
    }
  }

  async function handleSubmit() {
    setLoading(true)
    try {
      await saveStage2(projectId, form)
    } catch {
      setLoading(false)
    }
  }

  if (isLocked) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 mb-4 overflow-hidden opacity-50">
        <StagePanelHeader stageNum={2} title="Scope and Resources" state="locked" />
      </div>
    )
  }

  if (isCompleted && !isRevising) {
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
            <Section label="Scoring">
              <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold", score >= 3.5 ? "bg-green-50 text-green-700" : score >= 2.5 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700")}>
                Score: {score.toFixed(2)} / 5.0 {score >= 3.5 ? "— Qualifies" : score >= 2.5 ? "— Needs Revision" : "— Does Not Qualify"}
              </div>
            </Section>
            <button onClick={() => setIsRevising(true)} className="text-xs text-orange-600 hover:underline">Revise →</button>
          </div>
        )}
      </div>
    )
  }

  // Active: show form, or score feedback if data exists but didn't pass
  if (isActive && data && data.completedAt && (data.scoreTotal ?? 0) < 3.5 && !isRevising) {
    const score = data.scoreTotal
    return (
      <div className="bg-white rounded-xl border border-orange-200 mb-4 overflow-hidden">
        <StagePanelHeader stageNum={2} title="Scope and Resources" state="active" />
        <div className="px-5 pb-5 border-t border-gray-100 pt-4">
          <div className={cn("p-4 rounded-lg mb-4 text-sm", score >= 2.5 ? "bg-amber-50 border border-amber-200 text-amber-800" : "bg-red-50 border border-red-200 text-red-800")}>
            <p className="font-semibold">Score: {score?.toFixed(2)} / 5.0 — {score >= 2.5 ? "Needs Revision" : "Does Not Qualify"}</p>
            <p className="mt-1">{score >= 2.5 ? "Score is 2.5–3.4. Return for IDS; specific gaps must be resolved and re-scored." : "Score is below 2.5. Project has been parked on the Long-Term Issues List."}</p>
          </div>
          {score >= 2.5 && (
            <button onClick={() => { setIsRevising(true); setStep(6) }} className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700">
              Revise Scores
            </button>
          )}
        </div>
      </div>
    )
  }

  const score = calcWeighted(form)

  return (
    <div className="bg-white rounded-xl border border-orange-200 mb-4 overflow-hidden">
      <StagePanelHeader stageNum={2} title="Scope and Resources" state="active" />
      <div className="px-5 pb-5 border-t border-gray-100 pt-5">
        <StepBar total={TOTAL_STEPS} current={step} />

        {step === 1 && (
          <div className="space-y-4">
            <StepHeading title="Initiative Definition" subtitle="Describe what will be built, launched, or delivered." />
            <Field label="Description (2–4 sentences)">
              <TextArea value={form.description} onChange={(v) => set("description", v)} placeholder="Describe the initiative…" autoFocus />
            </Field>
            <Field label="Expected Outcome">
              <TextArea value={form.expectedOutcome} onChange={(v) => set("expectedOutcome", v)} placeholder="What will be measurably true when this initiative is complete?" rows={3} />
            </Field>
            <Field label="Target Audience">
              <TextInput value={form.targetAudience} onChange={(v) => set("targetAudience", v)} placeholder="e.g. Current members who use the laser cutter" />
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <StepHeading title="Financial Scope" />
            <Field label="Estimated one-time cost">
              <TextInput value={form.oneTimeCost} onChange={(v) => set("oneTimeCost", v)} placeholder="e.g. $2,500 for equipment" autoFocus />
            </Field>
            <Field label="Estimated ongoing cost">
              <TextInput value={form.ongoingCost} onChange={(v) => set("ongoingCost", v)} placeholder="e.g. $150/month materials" />
            </Field>
            <Field label="Estimated revenue or savings">
              <TextInput value={form.revenueOrSavings} onChange={(v) => set("revenueOrSavings", v)} placeholder="e.g. +$400/month from new tier memberships" />
            </Field>
            <Field label="Funding source">
              <div className="space-y-2 mt-1">
                {FUNDING_OPTIONS.map((o) => (
                  <label key={o.value} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer text-sm transition-colors", form.fundingSource === o.value ? "border-orange-500 bg-orange-50 text-orange-800 font-medium" : "border-gray-200 hover:border-gray-300 text-gray-700")}>
                    <input type="radio" name="funding" value={o.value} checked={form.fundingSource === o.value} onChange={() => set("fundingSource", o.value)} className="accent-orange-600" />
                    {o.label}
                  </label>
                ))}
              </div>
            </Field>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <StepHeading title="Staffing and Time" />
            <Field label="Estimated staff hours per week to launch">
              <TextInput value={form.staffHoursLaunch} onChange={(v) => set("staffHoursLaunch", v)} placeholder="e.g. 5 hrs/week" autoFocus />
            </Field>
            <Field label="Estimated staff hours per week to sustain">
              <TextInput value={form.staffHoursSustain} onChange={(v) => set("staffHoursSustain", v)} placeholder="e.g. 2 hrs/week" />
            </Field>
            <CheckCard checked={form.noStaffDisruption} onChange={(v) => set("noStaffDisruption", v)} title="No staff disruption" description="No current staff member's primary projects or responsibilities are materially disrupted." />
            <Field label="New staffing note (if applicable)">
              <TextArea value={form.newStaffingNote} onChange={(v) => set("newStaffingNote", v)} placeholder="Leave blank if no new staffing required. Otherwise describe scope and budget confirmation." rows={2} />
            </Field>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <StepHeading title="Space and Equipment" />
            <Field label="Physical space required">
              <TextInput value={form.spaceRequired} onChange={(v) => set("spaceRequired", v)} placeholder="e.g. 200 sq ft in the fabrication lab, or 'no space needed'" autoFocus />
            </Field>
            <Field label="Equipment or tools required">
              <TextInput value={form.equipmentRequired} onChange={(v) => set("equipmentRequired", v)} placeholder="e.g. Existing laser cutter, or 'Purchase: Epilog Fusion $8k'" />
            </Field>
            <CheckCard checked={form.noResourceConflict} onChange={(v) => set("noResourceConflict", v)} title="No resource conflict" description="Space/equipment use does not conflict with existing member access, programs, or tools." />
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <StepHeading title="Timeline" />
            <Field label="Estimated launch date">
              <TextInput value={form.estimatedLaunchDate} onChange={(v) => set("estimatedLaunchDate", v)} placeholder="e.g. September 15, 2026" autoFocus />
            </Field>
            <CheckCard checked={form.isWithin90Days} onChange={(v) => set("isWithin90Days", v)} title="Achievable within one quarter (90 days)" description="This initiative can be launched within a single quarter." />
            {!form.isWithin90Days && (
              <Field label="Quarterly milestones (required if not 90-day)">
                <TextArea value={form.quarterlyMilestones} onChange={(v) => set("quarterlyMilestones", v)} placeholder="Define quarterly milestones for a phased approach…" rows={3} />
              </Field>
            )}
          </div>
        )}

        {step === 6 && (
          <div className="space-y-5">
            <StepHeading title="Scoring Matrix" subtitle="Score each criterion 1–5. Minimum weighted average of 3.5 to advance." />
            <div className="space-y-4">
              {SCORE_CRITERIA.map((c) => (
                <div key={c.key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-gray-700">{c.label}</label>
                    <span className="text-xs text-gray-400">{Math.round(c.weight * 100)}% weight</span>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => set(c.key, n)}
                        className={cn(
                          "w-10 h-10 rounded-lg border-2 text-sm font-semibold transition-colors",
                          form[c.key] === n ? "border-orange-500 bg-orange-500 text-white" : "border-gray-200 text-gray-500 hover:border-orange-300"
                        )}
                      >
                        {n}
                      </button>
                    ))}
                    {form[c.key] > 0 && (
                      <span className="self-center text-xs text-gray-400 ml-1">
                        → {(form[c.key] * c.weight).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {SCORE_CRITERIA.every((c) => form[c.key] > 0) && (
              <div className={cn("p-3 rounded-lg text-sm font-semibold", score >= 3.5 ? "bg-green-50 text-green-700" : score >= 2.5 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700")}>
                Weighted Average: {score.toFixed(2)} / 5.0 — {score >= 3.5 ? "Qualifies (≥ 3.5)" : score >= 2.5 ? "Needs Revision (2.5–3.4)" : "Does Not Qualify (< 2.5)"}
              </div>
            )}
          </div>
        )}

        {step === 7 && (
          <div className="space-y-4">
            <StepHeading title="Review and Submit" />
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3 text-sm">
              <ReviewLine label="Description" value={form.description} />
              <ReviewLine label="Expected Outcome" value={form.expectedOutcome} />
              <ReviewLine label="Funding Source" value={FUNDING_OPTIONS.find((o) => o.value === form.fundingSource)?.label ?? ""} />
              <ReviewLine label="Launch Date" value={form.estimatedLaunchDate} />
            </div>
            <div className={cn("p-4 rounded-lg text-sm", score >= 3.5 ? "bg-green-50 border border-green-200 text-green-800" : score >= 2.5 ? "bg-amber-50 border border-amber-200 text-amber-800" : "bg-red-50 border border-red-200 text-red-800")}>
              <p className="font-semibold">Score: {score.toFixed(2)} / 5.0</p>
              <p className="mt-0.5">{score >= 3.5 ? "Qualifies — will advance to Stage 3." : score >= 2.5 ? "Needs Revision — will not advance. Must re-score after IDS." : "Does Not Qualify — project will be parked."}</p>
            </div>
          </div>
        )}

        <StepNav
          step={step} total={TOTAL_STEPS} canNext={canAdvance()} loading={loading}
          onBack={() => setStep((s) => s - 1)} onNext={() => setStep((s) => s + 1)}
          onSubmit={handleSubmit}
          submitLabel={score >= 3.5 ? "Complete & Advance to Stage 3 →" : "Save Score Result"}
        />
      </div>
    </div>
  )
}

function ReviewLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{label}</p>
      <p className="text-gray-800 mt-0.5">{value}</p>
    </div>
  )
}

