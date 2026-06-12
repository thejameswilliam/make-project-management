"use client"

import { useState } from "react"
import { saveStage3 } from "@/app/actions/projects"
import {
  StepBar, StepNav, StepHeading, Field, TextInput, TextArea, CheckCard,
  StagePanelHeader, Section, CheckRow,
} from "./shared"
import type { Stage3Data } from "@prisma/client"

type FormData = {
  ownerName: string
  ownerGetsIt: boolean
  ownerWantsIt: boolean
  ownerHasCapacity: boolean
  projectStatement: string
  definitionOfDone: string
  month1Milestone: string
  month2Milestone: string
  month3Milestone: string
  scorecardMetric: string
  scorecardWeeklyTarget: string
  budgetConfirmed: boolean
  spaceConfirmed: boolean
  equipmentConfirmed: boolean
  staffHoursConfirmed: boolean
  topRisks: string
  contingencyPlan: string
}

const EMPTY: FormData = {
  ownerName: "", ownerGetsIt: false, ownerWantsIt: false, ownerHasCapacity: false,
  projectStatement: "", definitionOfDone: "",
  month1Milestone: "", month2Milestone: "", month3Milestone: "",
  scorecardMetric: "", scorecardWeeklyTarget: "",
  budgetConfirmed: false, spaceConfirmed: false, equipmentConfirmed: false, staffHoursConfirmed: false,
  topRisks: "", contingencyPlan: "",
}

function fromDb(d: Stage3Data): FormData {
  return {
    ownerName: d.ownerName, ownerGetsIt: d.ownerGetsIt, ownerWantsIt: d.ownerWantsIt,
    ownerHasCapacity: d.ownerHasCapacity, projectStatement: d.projectStatement,
    definitionOfDone: d.definitionOfDone, month1Milestone: d.month1Milestone,
    month2Milestone: d.month2Milestone, month3Milestone: d.month3Milestone,
    scorecardMetric: d.scorecardMetric, scorecardWeeklyTarget: d.scorecardWeeklyTarget,
    budgetConfirmed: d.budgetConfirmed, spaceConfirmed: d.spaceConfirmed,
    equipmentConfirmed: d.equipmentConfirmed, staffHoursConfirmed: d.staffHoursConfirmed,
    topRisks: d.topRisks, contingencyPlan: d.contingencyPlan,
  }
}

const TOTAL_STEPS = 7

export function Stage3Panel({
  projectId,
  data,
  currentStage,
}: {
  projectId: string
  data: Stage3Data | null
  currentStage: number
}) {
  const isLocked = currentStage < 3
  const isCompleted = currentStage > 3
  const [expanded, setExpanded] = useState(false)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<FormData>(data ? fromDb(data) : EMPTY)

  function set<K extends keyof FormData>(k: K, v: FormData[K]) {
    setForm((p) => ({ ...p, [k]: v }))
  }

  function canAdvance(): boolean {
    switch (step) {
      case 1: return !!form.ownerName && form.ownerGetsIt && form.ownerWantsIt && form.ownerHasCapacity
      case 2: return !!form.projectStatement && !!form.definitionOfDone
      case 3: return !!form.month1Milestone && !!form.month2Milestone && !!form.month3Milestone
      case 4: return !!form.scorecardMetric && !!form.scorecardWeeklyTarget
      case 5: return form.budgetConfirmed && form.spaceConfirmed && form.equipmentConfirmed && form.staffHoursConfirmed
      case 6: return !!form.topRisks && !!form.contingencyPlan
      case 7: return true
      default: return false
    }
  }

  async function handleSubmit() {
    setLoading(true)
    try {
      await saveStage3(projectId, form)
    } catch {
      setLoading(false)
    }
  }

  if (isLocked) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 mb-4 overflow-hidden opacity-50">
        <StagePanelHeader stageNum={3} title="Allocation and Owner" state="locked" />
      </div>
    )
  }

  if (isCompleted) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 mb-4 overflow-hidden">
        <StagePanelHeader
          stageNum={3} title="Allocation and Owner" state="completed"
          completedAt={data?.completedAt} isExpanded={expanded}
          onToggle={() => setExpanded((e) => !e)}
        />
        {expanded && data && (
          <div className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">
            <Section label="Project Owner">
              <p className="text-sm text-gray-700 font-medium">{data.ownerName}</p>
              <div className="mt-1.5 space-y-1">
                <CheckRow checked={data.ownerGetsIt} label="Gets It" />
                <CheckRow checked={data.ownerWantsIt} label="Wants It" />
                <CheckRow checked={data.ownerHasCapacity} label="Has Capacity" />
              </div>
            </Section>
            <Section label="Project Statement">
              <p className="text-sm text-gray-700 italic">"{data.projectStatement}"</p>
            </Section>
            <Section label="Definition of Done">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{data.definitionOfDone}</p>
            </Section>
            <Section label="Monthly Milestones">
              <div className="space-y-1">
                <p className="text-sm text-gray-700"><span className="font-medium text-gray-500">Month 1:</span> {data.month1Milestone}</p>
                <p className="text-sm text-gray-700"><span className="font-medium text-gray-500">Month 2:</span> {data.month2Milestone}</p>
                <p className="text-sm text-gray-700"><span className="font-medium text-gray-500">Month 3:</span> {data.month3Milestone}</p>
              </div>
            </Section>
            <Section label="Scorecard Metric">
              <p className="text-sm text-gray-700">{data.scorecardMetric} — Weekly target: {data.scorecardWeeklyTarget}</p>
            </Section>
            <Section label="Top Risks">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{data.topRisks}</p>
            </Section>
            <Section label="Contingency Plan">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{data.contingencyPlan}</p>
            </Section>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-orange-200 mb-4 overflow-hidden">
      <StagePanelHeader stageNum={3} title="Allocation and Owner" state="active" />
      <div className="px-5 pb-5 border-t border-gray-100 pt-5">
        <StepBar total={TOTAL_STEPS} current={step} />

        {step === 1 && (
          <div className="space-y-4">
            <StepHeading title="Project Owner" subtitle="The owner must GWC (Get it, Want it, have Capacity) this role." />
            <Field label="Owner Name">
              <TextInput value={form.ownerName} onChange={(v) => set("ownerName", v)} placeholder="Full name of the project owner" autoFocus />
            </Field>
            <CheckCard checked={form.ownerGetsIt} onChange={(v) => set("ownerGetsIt", v)} title="Gets It" description="Owner genuinely understands what this initiative requires — not just the concept, but the work, details, and dependencies." />
            <CheckCard checked={form.ownerWantsIt} onChange={(v) => set("ownerWantsIt", v)} title="Wants It" description="Owner actively wants to lead this initiative; it is not assigned as an obligation." />
            <CheckCard checked={form.ownerHasCapacity} onChange={(v) => set("ownerHasCapacity", v)} title="Has Capacity" description="Owner has the time, skills, and bandwidth to execute this quarter without dropping existing responsibilities." />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <StepHeading title="Project Statement and Definition of Done" />
            <Field label="Project Statement">
              <TextInput value={form.projectStatement} onChange={(v) => set("projectStatement", v)} placeholder="Complete [specific result] by [end of quarter date]" autoFocus />
              <p className="text-xs text-gray-400 mt-1">Format: [Action verb] [specific result] by [end of quarter date]</p>
            </Field>
            <Field label="Definition of Done (2–4 binary criteria)">
              <TextArea value={form.definitionOfDone} onChange={(v) => set("definitionOfDone", v)} placeholder={"One criterion per line. Each must be binary (done/not done).\ne.g. New printer is installed and passes test print\nAll existing members have received orientation email"} rows={5} />
            </Field>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <StepHeading title="Monthly Milestones" subtitle="What will be true at the end of each month?" />
            <Field label="Month 1">
              <TextArea value={form.month1Milestone} onChange={(v) => set("month1Milestone", v)} placeholder="What is true by the end of Month 1?" rows={2} autoFocus />
            </Field>
            <Field label="Month 2">
              <TextArea value={form.month2Milestone} onChange={(v) => set("month2Milestone", v)} placeholder="What is true by the end of Month 2?" rows={2} />
            </Field>
            <Field label="Month 3">
              <TextArea value={form.month3Milestone} onChange={(v) => set("month3Milestone", v)} placeholder="What is true by the end of Month 3?" rows={2} />
            </Field>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <StepHeading title="Scorecard" subtitle="Identify the leading indicator that will show weekly progress." />
            <Field label="Scorecard Metric">
              <TextInput value={form.scorecardMetric} onChange={(v) => set("scorecardMetric", v)} placeholder="e.g. Number of completed 3D printer orientations" autoFocus />
            </Field>
            <Field label="Weekly Target / Goal">
              <TextInput value={form.scorecardWeeklyTarget} onChange={(v) => set("scorecardWeeklyTarget", v)} placeholder="e.g. 3 orientations per week" />
            </Field>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <StepHeading title="Resources Confirmed" subtitle="All four must be confirmed before execution begins." />
            <CheckCard checked={form.budgetConfirmed} onChange={(v) => set("budgetConfirmed", v)} title="Budget Confirmed" description="Funds are reserved or reallocated in the operating budget (board approval obtained if required)." />
            <CheckCard checked={form.spaceConfirmed} onChange={(v) => set("spaceConfirmed", v)} title="Space Confirmed" description="Any facility changes or reservations are made." />
            <CheckCard checked={form.equipmentConfirmed} onChange={(v) => set("equipmentConfirmed", v)} title="Equipment Confirmed" description="Equipment is purchased, on order, or donation confirmed in writing." />
            <CheckCard checked={form.staffHoursConfirmed} onChange={(v) => set("staffHoursConfirmed", v)} title="Staff Hours Confirmed" description="Any adjusted workload is agreed to by affected staff members." />
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            <StepHeading title="Risk and Contingency" subtitle="Write 'if this, then that' statements — not a full risk plan." />
            <Field label="Top 1–2 Risks">
              <TextArea value={form.topRisks} onChange={(v) => set("topRisks", v)} placeholder={"e.g.\n1. Instructor cancellation\n2. Equipment delivery delayed"} rows={3} autoFocus />
            </Field>
            <Field label="Contingency Response">
              <TextArea value={form.contingencyPlan} onChange={(v) => set("contingencyPlan", v)} placeholder={"e.g.\n1. If instructor cancels, James covers first two sessions while recruiting\n2. If delivery delays >2 weeks, push launch to next quarter"} rows={4} />
            </Field>
          </div>
        )}

        {step === 7 && (
          <div className="space-y-4">
            <StepHeading title="Review and Confirm" />
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3 text-sm">
              <ReviewLine label="Owner" value={`${form.ownerName} (GWC ✓)`} />
              <ReviewLine label="Project Statement" value={form.projectStatement} />
              <ReviewLine label="Scorecard Metric" value={`${form.scorecardMetric} — target: ${form.scorecardWeeklyTarget}`} />
              <ReviewLine label="Month 1" value={form.month1Milestone} />
              <ReviewLine label="Month 2" value={form.month2Milestone} />
              <ReviewLine label="Month 3" value={form.month3Milestone} />
            </div>
            <p className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              Completing Stage 3 will advance this project into execution (Stage 4).
            </p>
          </div>
        )}

        <StepNav
          step={step} total={TOTAL_STEPS} canNext={canAdvance()} loading={loading}
          onBack={() => setStep((s) => s - 1)} onNext={() => setStep((s) => s + 1)}
          onSubmit={handleSubmit} submitLabel="Complete & Begin Execution →"
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
