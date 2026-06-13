"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function updateAccount(data: {
  name: string
  currentPassword?: string
  newPassword?: string
}): Promise<{ error?: string }> {
  const session = await getServerSession(authOptions)
  if (!session?.user) return { error: "Unauthorized" }

  const userId = (session.user as { id: string }).id
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return { error: "User not found" }

  if (data.newPassword) {
    if (!data.currentPassword) return { error: "Current password is required to set a new password." }
    const valid = await bcrypt.compare(data.currentPassword, user.password)
    if (!valid) return { error: "Current password is incorrect." }
    if (data.newPassword.length < 8) return { error: "New password must be at least 8 characters." }
    const hashed = await bcrypt.hash(data.newPassword, 12)
    await prisma.user.update({ where: { id: userId }, data: { name: data.name, password: hashed } })
  } else {
    await prisma.user.update({ where: { id: userId }, data: { name: data.name } })
  }

  return {}
}
