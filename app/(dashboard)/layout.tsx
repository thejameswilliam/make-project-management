import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { SignOutButton } from "@/components/SignOutButton"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-5 h-5 bg-orange-600 rounded" />
            <span className="font-semibold text-gray-900 text-sm">Make Santa Fe / PM</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {session.user?.name ?? session.user?.email}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
