import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { STAGE_NAMES, STATUS_LABELS, STATUS_COLORS } from "@/lib/utils"
import { DeleteProjectButton } from "@/components/DeleteProjectButton"
import { Stage1Panel } from "@/components/stages/Stage1Panel"
import { Stage2Panel } from "@/components/stages/Stage2Panel"
import { Stage3Panel } from "@/components/stages/Stage3Panel"
import { Stage4Panel } from "@/components/stages/Stage4Panel"
import { Stage5Panel } from "@/components/stages/Stage5Panel"

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const sessionUser = session?.user as { id: string; role: string } | undefined
  const userId = sessionUser?.id ?? ""
  const userRole = sessionUser?.role ?? "STAFF"

  const [project, leaders, coreValues, yearPlans, strategicPlan] = await Promise.all([
    prisma.project.findUnique({
      where: { id: params.id },
      include: {
        proposedBy: { select: { name: true, email: true } },
        stage1: { include: { goal: { select: { title: true } } } },
        stage2: {
          include: {
            scores: {
              include: { user: { select: { name: true, email: true } } },
            },
          },
        },
        stage3: true,
        stage4: { include: { weeklyUpdates: { orderBy: { createdAt: "asc" } } } },
        stage5: true,
      },
    }),
    prisma.user.findMany({
      where: { role: { in: ["LEADERSHIP", "ADMIN"] } },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.coreValue.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.oneYearPlan.findMany({
      orderBy: { pillar: { order: "asc" } },
      include: {
        goals: { orderBy: { order: "asc" } },
        pillar: { select: { title: true } },
      },
    }),
    prisma.strategicPlan.findFirst({ select: { mission: true, tenYearTarget: true } }),
  ])

  if (!project) notFound()

  const isFinished = !!project.stage5?.completedAt
  const progress = isFinished ? 100 : Math.round(((project.currentStage - 1) / 5) * 100)

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
          ← All Projects
        </Link>
        <DeleteProjectButton projectId={project.id} />
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 truncate">{project.name}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Proposed by {project.proposedBy.name ?? project.proposedBy.email} ·{" "}
              {new Date(project.createdAt).toLocaleDateString("en-US", {
                month: "long", day: "numeric", year: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full font-medium whitespace-nowrap">
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

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Progress</span>
            <span>{project.currentStage} of 5 stages</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stage pipeline */}
      {project.stage1 && (
        <Stage1Panel
          data={project.stage1}
          goalTitle={project.stage1.goal?.title}
          userRole={userRole}
          projectId={project.id}
          projectName={project.name}
          coreValues={coreValues}
          yearPlans={yearPlans.map((p) => ({ ...p, pillarTitle: p.pillar.title }))}
          mission={strategicPlan?.mission ?? ""}
          tenYearTarget={strategicPlan?.tenYearTarget ?? ""}
        />
      )}

      <Stage2Panel
        projectId={project.id}
        data={project.stage2}
        currentStage={project.currentStage}
        userId={userId}
        userRole={userRole}
        leaders={leaders}
      />

      <Stage3Panel
        projectId={project.id}
        data={project.stage3}
        currentStage={project.currentStage}
        userRole={userRole}
      />

      <Stage4Panel
        projectId={project.id}
        data={project.stage4}
        currentStage={project.currentStage}
        month1Metric={project.stage3?.month1Metric ?? undefined}
        month2Metric={project.stage3?.month2Metric ?? undefined}
        month3Metric={project.stage3?.month3Metric ?? undefined}
        userRole={userRole}
      />

      <Stage5Panel
        projectId={project.id}
        data={project.stage5}
        currentStage={project.currentStage}
        userRole={userRole}
        definitionOfDone={project.stage3?.definitionOfDone ?? undefined}
      />
    </div>
  )
}
