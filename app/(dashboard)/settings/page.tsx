import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { SettingsManager } from "@/components/SettingsManager"
import { getOrCreateStrategicPlan } from "@/app/actions/settings"

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as { role?: string })?.role
  if (role !== "ADMIN") redirect("/")

  const currentUserId = (session?.user as { id?: string })?.id ?? ""

  const [coreValues, strategicPlan, users] = await Promise.all([
    prisma.coreValue.findMany({ orderBy: { createdAt: "asc" } }),
    getOrCreateStrategicPlan(),
    prisma.user.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, email: true, role: true } }),
  ])

  return (
    <div className="max-w-xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure global values and manage team roles.
        </p>
      </div>
      <SettingsManager
        coreValues={coreValues}
        strategicPlan={strategicPlan}
        users={users}
        currentUserId={currentUserId}
      />
    </div>
  )
}
