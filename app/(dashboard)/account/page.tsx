import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { AccountForm } from "@/components/AccountForm"

export default async function AccountPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/login")

  const userId = (session.user as { id: string }).id
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } })
  if (!user) redirect("/login")

  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Account</h1>
      <p className="text-sm text-gray-500 mb-8">{user.email}</p>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <AccountForm initialName={user.name ?? ""} />
      </div>
    </div>
  )
}
