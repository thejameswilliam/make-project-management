"use client"

import { useState } from "react"
import { saveStage5, saveStage5Draft } from "@/app/actions/projects"
import { useRouter } from "next/navigation"
import {
  StepBar, StepNav, StepHeading, Field, TextArea,
  StagePanelHeader, Section, CheckRow,
} from "./shared"
import type { Stage5Data } from "@prisma/client"

const NEXT_STEP_OPTIONS = [
  { value: "RETIRE", label: "Complete / Retire", description: "One-time initiative, fully delivered, no continuation needed." },
  { value: "SUSTAIN", label: "Complete / Sustain", description: "Initiative becomes an ongoing program or operation." },
  { value: "EXPAND", label: "Complete / Expand", description: "Initiative succeeded and warrants growing it." },
  { value: "CARRY", label: "Incomplete / Carry", description: "Rock not finished — redefine for next quarter." },
  { value: "KILL", label: "Incomplete / Kill", description: "Leadership has decided to abandon this initiative." },
]

type FormData = {
  definitionOfDoneReview: string
  scorecardSummary: string
  financialImpact: string
  missionImpact: string
  operationalImpact: string
  lessonsLearned: string
  nextStepDecision: string
  processDocumentation: string
}

const EMPTY: FormData = {
  definitionOfDoneReview: "", scorecardSummary: "",
  financialImpact: "", missionImpact: "", operationalImpact: "",
  lessonsLearned: "", nextStepDecision: "", processDocumentation: "",
}

function fromDb(d: Stage5Data): FormData {
  return {
    definitionOfDoneReview: d.definitionOfDoneReview, scorecardSummary: d.scorecardSummary,
    financialImpact: d.financialImpact, missionImpact: d.missionImpact,
    operationalImpact: d.operationalImpact, lessonsLearned: d.lessonsLearned,
    nextStepDecision: d.nextStepDecision, processDocumentation: d.processDocumentation ?? "",
  }
}

const TOTAL_STEPS = 6

export function Stage5Panel({
  projectId,
  data,
  currentStage,
  userRole,
  definitionOfDone,
}: {
  projectId: string
  data: Stage5Data | null
  currentStage: number
  userRole: string
  definitionOfDone?: string
}) {
  const isLocked = currentStage < 5
  const isCompleted = !!data?.completedAt
  const isLeader = userRole === "LEADERSHIP" || userRole === "ADMIN"
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<FormData>(data ? fromDb(data) : EMPTY)

  function set<K extends keyof FormData>(k: K, v: FormData[K]) {
    setForm((p) => ({ ...p, [k]: v }))
  }

  const needsProcessDoc = form.nextStepDecision === "SUSTAIN" || form.nextStepDecision === "EXPAND"

  function canAdvance(): boolean {
    switch (step) {
      case 1: return !!form.definitionOfDoneReview
      case 2: return !!form.scorecardSummary
      case 3: return !!form.financialImpact && !!form.missionImpact && !!form.operationalImpact
      case 4: return !!form.lessonsLearned
      case 5: return !!form.nextStepDecision
      case 6: return needsProcessDoc ? !!form.processDocumentation : true
      default: return false
    }
  }

  async function handleSubmit() {
    setLoading(true)
    try {
      if (isLeader) {
        await saveStage5(projectId, form)
      } else {
        await saveStage5Draft(projectId, form)
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
        <StagePanelHeader stageNum={5} title="Finish" state="locked" />
      </div>
    )
  }

  if (isCompleted) {
    const nextOpt = NEXT_STEP_OPTIONS.find((o) => o.value === data?.nextStepDecision)
    return (
      <div className="bg-white rounded-xl border border-gray-200 mb-4 overflow-hidden">
        <StagePanelHeader
          stageNum={5} title="Finish" state="completed"
          completedAt={data?.completedAt} isExpanded={expanded}
          onToggle={() => setExpanded((e) => !e)}
        />
        {expanded && data && (
          <div className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">
            <Section label="Completion Review">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{data.definitionOfDoneReview}</p>
            </Section>
            <Section label="Impact">
              <div className="space-y-2">
                <div><p className="text-xs text-gray-400 font-medium">Financial</p><p className="text-sm text-gray-700">{data.financialImpact}</p></div>
                <div><p className="text-xs text-gray-400 font-medium">Mission</p><p className="text-sm text-gray-700">{data.missionImpact}</p></div>
                <div><p className="text-xs text-gray-400 font-medium">Operational</p><p className="text-sm text-gray-700">{data.operationalImpact}</p></div>
              </div>
            </Section>
            <Section label="Lessons Learned">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{data.lessonsLearned}</p>
            </Section>
            <Section label="Next Step">
              <span className="inline-block text-sm font-semibold bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                {nextOpt?.label ?? data.nextStepDecision}
              </span>
              {data.processDocumentation && (
                <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{data.processDocumentation}</p>
              )}
            </Section>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-orange-200 mb-4 overflow-hidden">
      <StagePanelHeader stageNum={5} title="Finish" state="active" />
      <div className="px-5 pb-5 border-t border-gray-100 pt-5">
        <StepBar total={TOTAL_STEPS} current={step} />

        {step === 1 && (
          <div className="space-y-4">
            <StepHeading title="Completion Review" subtitle="Review each Definition of Done criterion. 'Done' is binary — not 'mostly done'." />
            {definitionOfDone && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Definition of Done
                </p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{definitionOfDone}</p>
              </div>
            )}
            <Field label="Completion Review">
              <TextArea
                value={form.definitionOfDoneReview}
                onChange={(v) => set("definitionOfDoneReview", v)}
                placeholder={"Go through each DoD criterion and note: done or not done, and any relevant context.\n\ne.g.\n✓ New printer installed and test print passed\n✗ Member orientation email not yet sent — moved to next quarter"}
                rows={6}
                autoFocus
              />
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <StepHeading title="Scorecard Results" subtitle="Did the leading indicator reflect actual results?" />
            <Field label="Scorecard Summary">
              <TextArea
                value={form.scorecardSummary}
                onChange={(v) => set("scorecardSummary", v)}
                placeholder="Summarize the metric results for the quarter. Did the weekly leading indicator predict the final outcome? What did the data show?"
                rows={5}
                autoFocus
              />
            </Field>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <StepHeading title="Impact Assessment" />
            <Field label="Financial Impact">
              <TextArea
                value={form.financialImpact}
                onChange={(v) => set("financialImpact", v)}
                placeholder="Actual revenue generated, costs incurred, and variance from budget projection."
                rows={3}
                autoFocus
              />
            </Field>
            <Field label="Mission Impact">
              <TextArea
                value={form.missionImpact}
                onChange={(v) => set("missionImpact", v)}
                placeholder="Members served, students taught, community reached, access expanded — quantified where possible."
                rows={3}
              />
            </Field>
            <Field label="Operational Impact">
              <TextArea
                value={form.operationalImpact}
                onChange={(v) => set("operationalImpact", v)}
                placeholder="Did this improve, strain, or have no effect on daily operations and staff workload?"
                rows={2}
              />
            </Field>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <StepHeading title="What Did We Learn?" subtitle="3–5 bullet points. Include what went wrong, what surprised you, and what you'd do differently." />
            <Field label="Lessons Learned">
              <TextArea
                value={form.lessonsLearned}
                onChange={(v) => set("lessonsLearned", v)}
                placeholder={"• We underestimated training time for staff — budget 2x next time\n• Member demand was 3x projected — a good problem\n• Partnering with [org] opened an unexpected grant opportunity"}
                rows={6}
                autoFocus
              />
            </Field>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <StepHeading title="Next-Step Decision" />
            <div className="space-y-2">
              {NEXT_STEP_OPTIONS.map((o) => (
                <label
                  key={o.value}
                  className={`flex gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${form.nextStepDecision === o.value ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-gray-300"}`}
                >
                  <input type="radio" name="nextStep" value={o.value} checked={form.nextStepDecision === o.value} onChange={() => set("nextStepDecision", o.value)} className="mt-0.5 accent-orange-600 shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{o.label}</p>
                    <p className="text-gray-500 text-sm mt-0.5">{o.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            <StepHeading title="Final Review" />
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3 text-sm">
              <ReviewLine label="Next Step" value={NEXT_STEP_OPTIONS.find((o) => o.value === form.nextStepDecision)?.label ?? ""} />
              <ReviewLine label="Financial Impact" value={form.financialImpact} />
              <ReviewLine label="Mission Impact" value={form.missionImpact} />
            </div>
            {needsProcessDoc && (
              <Field label="Process Documentation Plan (required for Sustain or Expand)">
                <TextArea
                  value={form.processDocumentation}
                  onChange={(v) => set("processDocumentation", v)}
                  placeholder="Name the process. Who will document it, by when? Where will it live in the Make Operations folder?"
                  rows={3}
                />
              </Field>
            )}
            <p className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              Completing Stage 5 will close out this project.
            </p>
          </div>
        )}

        <StepNav
          step={step} total={TOTAL_STEPS} canNext={canAdvance()} loading={loading}
          onBack={() => setStep((s) => s - 1)} onNext={() => setStep((s) => s + 1)}
          onSubmit={handleSubmit} submitLabel={isLeader ? "Close Out Project →" : "Save Progress"}
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
