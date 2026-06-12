"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { saveStage3, saveStage3Draft } from "@/app/actions/projects"
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
  month1Metric: string
  month1Target: string
  month2Milestone: string
  month2Metric: string
  month2Target: string
  month3Milestone: string
  month3Metric: string
  month3Target: string
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
  month1Milestone: "", month1Metric: "", month1Target: "",
  month2Milestone: "", month2Metric: "", month2Target: "",
  month3Milestone: "", month3Metric: "", month3Target: "",
  budgetConfirmed: false, spaceConfirmed: false, equipmentConfirmed: false, staffHoursConfirmed: false,
  topRisks: "", contingencyPlan: "",
}

function fromDb(d: Stage3Data): FormData {
  return {
    ownerName: d.ownerName, ownerGetsIt: d.ownerGetsIt, ownerWantsIt: d.ownerWantsIt,
    ownerHasCapacity: d.ownerHasCapacity, projectStatement: d.projectStatement,
    definitionOfDone: d.definitionOfDone,
    month1Milestone: d.month1Milestone, month1Metric: d.month1Metric, month1Target: d.month1Target,
    month2Milestone: d.month2Milestone, month2Metric: d.month2Metric, month2Target: d.month2Target,
    month3Milestone: d.month3Milestone, month3Metric: d.month3Metric, month3Target: d.month3Target,
    budgetConfirmed: d.budgetConfirmed, spaceConfirmed: d.spaceConfirmed,
    equipmentConfirmed: d.equipmentConfirmed, staffHoursConfirmed: d.staffHoursConfirmed,
    topRisks: d.topRisks, contingencyPlan: d.contingencyPlan,
  }
}

const TOTAL_STEPS = 6

export function Stage3Panel({
  projectId,
  data,
  currentStage,
  userRole,
}: {
  projectId: string
  data: Stage3Data | null
  currentStage: number
  userRole: string
}) {
  const isLocked = currentStage < 3
  const isCompleted = currentStage > 3
  const isLeader = userRole === "LEADERSHIP" || userRole === "ADMIN"
  const router = useRouter()
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
      case 3:
        return !!form.month1Milestone && !!form.month1Metric &&
               !!form.month2Milestone && !!form.month2Metric &&
               !!form.month3Milestone && !!form.month3Metric
      case 4: return isLeader
          ? form.budgetConfirmed && form.spaceConfirmed && form.equipmentConfirmed && form.staffHoursConfirmed
          : true
      case 5: return !!form.topRisks && !!form.contingencyPlan
      case 6: return true
      default: return false
    }
  }

  async function handleSubmit() {
    setLoading(true)
    try {
      if (isLeader) {
        await saveStage3(projectId, form)
      } else {
        await saveStage3Draft(projectId, form)
        setLoading(false)
        router.refresh()
      }
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
              <div className="space-y-3">
                {([
                  { label: "Month 1", milestone: data.month1Milestone, metric: data.month1Metric, target: data.month1Target },
                  { label: "Month 2", milestone: data.month2Milestone, metric: data.month2Metric, target: data.month2Target },
                  { label: "Month 3", milestone: data.month3Milestone, metric: data.month3Metric, target: data.month3Target },
                ]).map(({ label, milestone, metric, target }) => (
                  <div key={label} className="pl-3 border-l-2 border-orange-200">
                    <p className="text-xs font-semibold text-orange-600 mb-1">{label}</p>
                    <p className="text-sm text-gray-700">{milestone}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Metric: <span className="text-gray-700">{metric}</span>
                      {target && <> · Target: <span className="text-gray-700">{target}</span></>}
                    </p>
                  </div>
                ))}
              </div>
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
          <div className="space-y-5">
            <StepHeading title="Monthly Milestones & Metrics" subtitle="For each month, define the milestone and how you'll measure progress toward it." />
            {([
              { num: 1, milestone: "month1Milestone", metric: "month1Metric", target: "month1Target" },
              { num: 2, milestone: "month2Milestone", metric: "month2Metric", target: "month2Target" },
              { num: 3, milestone: "month3Milestone", metric: "month3Metric", target: "month3Target" },
            ] as const).map(({ num, milestone, metric, target }, i) => (
              <div key={num} className="rounded-xl border border-gray-200 p-4 space-y-3">
                <p className="text-sm font-semibold text-orange-600">Month {num}</p>
                <Field label="Milestone — what will be true by end of this month?">
                  <TextArea
                    value={form[milestone]}
                    onChange={(v) => set(milestone, v)}
                    placeholder={`What is achieved by the end of month ${num}?`}
                    rows={2}
                    autoFocus={i === 0}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Tracking Metric">
                    <TextInput
                      value={form[metric]}
                      onChange={(v) => set(metric, v)}
                      placeholder="e.g. Orientations completed"
                    />
                  </Field>
                  <Field label="Weekly Target">
                    <TextInput
                      value={form[target]}
                      onChange={(v) => set(target, v)}
                      placeholder="e.g. 4 per week"
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <StepHeading title="Resources Confirmed" subtitle="All four must be confirmed by leadership before execution begins." />
            {!isLeader && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                These confirmations require a Leadership or Admin role.
              </p>
            )}
            <CheckCard checked={form.budgetConfirmed} onChange={(v) => set("budgetConfirmed", v)} disabled={!isLeader} title="Budget Confirmed" description="Funds are reserved or reallocated in the operating budget (board approval obtained if required)." />
            <CheckCard checked={form.spaceConfirmed} onChange={(v) => set("spaceConfirmed", v)} disabled={!isLeader} title="Space Confirmed" description="Any facility changes or reservations are made." />
            <CheckCard checked={form.equipmentConfirmed} onChange={(v) => set("equipmentConfirmed", v)} disabled={!isLeader} title="Equipment Confirmed" description="Equipment is purchased, on order, or donation confirmed in writing." />
            <CheckCard checked={form.staffHoursConfirmed} onChange={(v) => set("staffHoursConfirmed", v)} disabled={!isLeader} title="Staff Hours Confirmed" description="Any adjusted workload is agreed to by affected staff members." />
          </div>
        )}

        {step === 5 && (
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

        {step === 6 && (
          <div className="space-y-4">
            <StepHeading title="Review and Confirm" />
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3 text-sm">
              <ReviewLine label="Owner" value={`${form.ownerName} (GWC ✓)`} />
              <ReviewLine label="Project Statement" value={form.projectStatement} />
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">Monthly Milestones</p>
                <div className="space-y-2">
                  {([
                    { label: "Month 1", milestone: form.month1Milestone, metric: form.month1Metric, target: form.month1Target },
                    { label: "Month 2", milestone: form.month2Milestone, metric: form.month2Metric, target: form.month2Target },
                    { label: "Month 3", milestone: form.month3Milestone, metric: form.month3Metric, target: form.month3Target },
                  ]).map(({ label, milestone, metric, target }) => (
                    <div key={label} className="pl-3 border-l-2 border-orange-200">
                      <p className="text-xs font-semibold text-orange-600">{label}</p>
                      <p className="text-gray-800 mt-0.5">{milestone}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {metric}{target ? ` — weekly target: ${target}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {isLeader && (
              <p className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                Completing Stage 3 will advance this project into execution (Stage 4).
              </p>
            )}
          </div>
        )}

        <StepNav
          step={step} total={TOTAL_STEPS} canNext={canAdvance()} loading={loading}
          onBack={() => setStep((s) => s - 1)} onNext={() => setStep((s) => s + 1)}
          onSubmit={handleSubmit} submitLabel={isLeader ? "Complete & Begin Execution →" : "Save Progress"}
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
