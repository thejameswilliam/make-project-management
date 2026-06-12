import Link from "next/link"
import { NewProjectForm } from "@/components/NewProjectForm"
import { prisma } from "@/lib/prisma"

export default async function NewProjectPage() {
  const [coreValues, oneYearGoals] = await Promise.all([
    prisma.coreValue.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.oneYearGoal.findMany({ orderBy: { createdAt: "asc" } }),
  ])

  return (
    <div>
      <div className="mb-6">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
          ← All Projects
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-3">New Project</h1>
        <p className="text-sm text-gray-500 mt-0.5">Stage 1: Pitch and Propose</p>
      </div>
      <NewProjectForm coreValues={coreValues} oneYearGoals={oneYearGoals} />
    </div>
  )
}
