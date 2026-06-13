import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { STAGE_NAMES, STATUS_LABELS, STATUS_COLORS } from "@/lib/utils"

const PROJECT_LIMIT = 3

const STAGE_ACCENTS = [
  { dot: "bg-gray-400",   header: "text-gray-500"   },
  { dot: "bg-orange-500", header: "text-orange-600" },
  { dot: "bg-blue-500",   header: "text-blue-600"   },
  { dot: "bg-violet-500", header: "text-violet-600" },
  { dot: "bg-green-500",  header: "text-green-600"  },
]

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const userId = (session!.user as { id: string }).id
  const role = (session!.user as { role: string }).role

  const isLeader = role === "LEADERSHIP" || role === "ADMIN"

  const [projects, activeCount] = await Promise.all([
    prisma.project.findMany({
      include: {
        proposedBy: { select: { name: true, email: true } },
        stage2: {
          select: {
            completedAt: true,
            scores: isLeader ? { where: { userId }, select: { id: true } } : false,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    role !== "ADMIN"
      ? prisma.project.count({
          where: {
            proposedById: userId,
            status: { in: ["ACTIVE", "PARKED"] },
          },
        })
      : Promise.resolve(0),
  ])

  const atLimit = role !== "ADMIN" && activeCount >= PROJECT_LIMIT

  const columns = [1, 2, 3, 4, 5].map((stage) => ({
    stage,
    name: STAGE_NAMES[stage - 1],
    projects: projects.filter((p) => p.currentStage === stage),
  }))

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {projects.length} {projects.length === 1 ? "project" : "projects"}
          </p>
        </div>
        {atLimit ? (
          <span
            title={`You have ${PROJECT_LIMIT} active projects — retire one to add another.`}
            className="bg-gray-100 text-gray-400 px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed select-none"
          >
            + New Project
          </span>
        ) : (
          <Link
            href="/projects/new"
            className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
          >
            + New Project
          </Link>
        )}
      </div>

      {/* Board */}
      <div className="overflow-x-auto -mx-6">
        <div className="flex gap-3 px-6 pb-6 min-w-max items-start">
          {columns.map(({ stage, name, projects: colProjects }) => {
            const accent = STAGE_ACCENTS[stage - 1]
            return (
              <div key={stage} className="w-64 flex-shrink-0">
                {/* Column header */}
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${accent.dot}`} />
                  <span className={`text-xs font-semibold uppercase tracking-wide ${accent.header}`}>
                    {stage}. {name}
                  </span>
                  <span className="ml-auto text-xs text-gray-400 font-medium">{colProjects.length}</span>
                </div>

                {/* Cards */}
                <div className="space-y-2">
                  {colProjects.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-200 rounded-xl py-8 text-center">
                      <p className="text-xs text-gray-400">No projects</p>
                    </div>
                  ) : (
                    colProjects.map((project) => (
                      <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className="block bg-white border border-gray-200 rounded-xl p-4 hover:border-orange-300 hover:shadow-sm transition-all group"
                      >
                        <p className="text-sm font-medium text-gray-900 group-hover:text-orange-700 transition-colors leading-snug mb-2">
                          {project.name}
                        </p>
                        <p className="text-xs text-gray-400 mb-3">
                          {project.proposedBy.name ?? project.proposedBy.email}
                        </p>
                        {isLeader &&
                          project.currentStage === 2 &&
                          project.stage2 &&
                          !project.stage2.completedAt &&
                          project.stage2.scores?.length === 0 && (
                            <p className="text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-2.5 py-1.5 mb-3">
                              Your score needed
                            </p>
                          )}
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              STATUS_COLORS[project.status] ?? "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {STATUS_LABELS[project.status] ?? project.status}
                          </span>
                          <span className="text-xs text-gray-300">
                            {new Date(project.updatedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
