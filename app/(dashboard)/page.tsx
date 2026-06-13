import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { STAGE_NAMES, STATUS_LABELS, STATUS_COLORS } from "@/lib/utils"

const PROJECT_LIMIT = 3

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const userId = (session!.user as { id: string }).id
  const role = (session!.user as { role: string }).role

  const [projects, activeCount] = await Promise.all([
    prisma.project.findMany({
      include: { proposedBy: { select: { name: true, email: true } } },
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

  return (
    <div>
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

      {projects.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <div className="w-5 h-5 bg-orange-600 rounded" />
          </div>
          <p className="text-gray-900 font-medium">No projects yet</p>
          <p className="text-gray-500 text-sm mt-1">Submit the first project to get started.</p>
          <Link
            href="/projects/new"
            className="inline-block mt-4 text-sm text-orange-600 font-medium hover:underline"
          >
            Submit a project →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors group"
            >
              <div>
                <p className="font-medium text-gray-900 group-hover:text-orange-700 transition-colors">
                  {project.name}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {project.proposedBy.name ?? project.proposedBy.email} ·{" "}
                  {new Date(project.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2">
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
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
