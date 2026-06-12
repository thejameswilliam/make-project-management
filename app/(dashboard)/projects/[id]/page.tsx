import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { STAGE_NAMES, STATUS_LABELS, STATUS_COLORS } from "@/lib/utils"

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      proposedBy: { select: { name: true, email: true } },
      stage1: true,
    },
  })

  if (!project) notFound()

  const { stage1 } = project

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
          ← All Projects
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Proposed by {project.proposedBy.name ?? project.proposedBy.email} ·{" "}
              {new Date(project.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full font-medium">
              Stage {project.currentStage}: {STAGE_NAMES[project.currentStage - 1]}
            </span>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                STATUS_COLORS[project.status] ?? "bg-gray-100 text-gray-600"
              }`}
            >
              {STATUS_LABELS[project.status] ?? project.status}
            </span>
          </div>
        </div>
      </div>

      {/* Stage 1 */}
      {stage1 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <CheckCircle />
            <h2 className="font-semibold text-gray-900">Stage 1: Pitch and Propose</h2>
            {stage1.completedAt && (
              <span className="ml-auto text-xs text-gray-400">
                Completed{" "}
                {new Date(stage1.completedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            )}
          </div>

          <div className="space-y-5">
            <Section label="Problem / Opportunity Statement">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {stage1.problemStatement}
              </p>
            </Section>

            <Section label="Core Focus Filter">
              <div className="space-y-1.5">
                <Check checked={stage1.missionAlignment} label="Mission alignment" />
                <Check checked={stage1.nicheFit} label="Niche fit" />
                <Check checked={stage1.tenYearAlignment} label="10-Year Target alignment" />
              </div>
            </Section>

            <Section label="Core Values">
              <Check
                checked={stage1.noCoreValueViolated}
                label={`Embodies "${stage1.coreValueName}" · No Core Value violated`}
              />
            </Section>

            <Section label="1-Year Plan Relevance">
              {stage1.isStrategicException ? (
                <div>
                  <span className="inline-block text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-medium mb-1.5">
                    Strategic Exception
                  </span>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {stage1.strategicExceptionNote}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {stage1.oneYearPlanGoal}
                </p>
              )}
            </Section>

            <Section label="Distraction Risk">
              <Check
                checked={stage1.noDistractionRisk}
                label="No existing projects will be abandoned"
              />
            </Section>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-6 text-center text-gray-500 text-sm">
          Stage 1 data not found.
        </div>
      )}

      {/* Placeholder for future stages */}
      {[2, 3, 4, 5].map((s) => (
        <div
          key={s}
          className="mt-4 bg-white rounded-xl border border-gray-100 px-6 py-4 flex items-center gap-3 opacity-50"
        >
          <div className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0" />
          <p className="text-sm text-gray-400 font-medium">
            Stage {s}: {STAGE_NAMES[s - 1]}
          </p>
        </div>
      ))}
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
        {label}
      </p>
      {children}
    </div>
  )
}

function Check({ checked, label }: { checked: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
          checked ? "bg-green-100" : "bg-gray-100"
        }`}
      >
        {checked && (
          <svg
            className="w-2.5 h-2.5 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <p className="text-sm text-gray-700">{label}</p>
    </div>
  )
}

function CheckCircle() {
  return (
    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center shrink-0">
      <svg
        className="w-3 h-3 text-green-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={3}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </div>
  )
}
