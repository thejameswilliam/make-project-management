import Link from "next/link"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NewProjectForm } from "@/components/NewProjectForm"
import { prisma } from "@/lib/prisma"

const PROJECT_LIMIT = 3

export default async function NewProjectPage() {
  const session = await getServerSession(authOptions)
  const userId = (session!.user as { id: string }).id
  const role = (session!.user as { role: string }).role

  const [coreValues, yearPlans, strategicPlan, activeCount] = await Promise.all([
    prisma.coreValue.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.oneYearPlan.findMany({
      orderBy: { pillar: { order: "asc" } },
      include: {
        goals: { orderBy: { order: "asc" } },
        pillar: { select: { title: true } },
      },
    }),
    prisma.strategicPlan.findFirst({ select: { mission: true, tenYearTarget: true } }),
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
      <div className="mb-6">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
          ← All Projects
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-3">New Project</h1>
        <p className="text-sm text-gray-500 mt-0.5">Stage 1: Pitch and Propose</p>
      </div>
      {atLimit ? (
        <div className="max-w-xl bg-amber-50 border border-amber-200 rounded-xl px-6 py-5">
          <p className="text-sm font-semibold text-amber-800 mb-1">Project limit reached</p>
          <p className="text-sm text-amber-700">
            You already have {PROJECT_LIMIT} active projects. A project must be retired before you can submit a new one.
          </p>
          <Link href="/" className="inline-block mt-4 text-sm text-orange-600 font-medium hover:underline">
            ← Back to projects
          </Link>
        </div>
      ) : (
        <NewProjectForm
          coreValues={coreValues}
          yearPlans={yearPlans.map((p) => ({ ...p, pillarTitle: p.pillar.title }))}
          mission={strategicPlan?.mission ?? ""}
          tenYearTarget={strategicPlan?.tenYearTarget ?? ""}
        />
      )}
    </div>
  )
}
