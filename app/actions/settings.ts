"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as { role?: string })?.role
  if (role !== "ADMIN") throw new Error("Admin role required")
}

export async function addCoreValue(name: string) {
  await requireAdmin()
  await prisma.coreValue.create({ data: { name: name.trim() } })
  revalidatePath("/settings")
}

export async function deleteCoreValue(id: string) {
  await requireAdmin()
  await prisma.coreValue.delete({ where: { id } })
  revalidatePath("/settings")
}

export async function addOneYearGoal(description: string) {
  await requireAdmin()
  await prisma.oneYearGoal.create({ data: { description: description.trim() } })
  revalidatePath("/settings")
}

export async function deleteOneYearGoal(id: string) {
  await requireAdmin()
  await prisma.oneYearGoal.delete({ where: { id } })
  revalidatePath("/settings")
}

export async function updateUserRole(userId: string, role: string) {
  await requireAdmin()
  await prisma.user.update({ where: { id: userId }, data: { role: role as any } })
  revalidatePath("/settings")
}

export async function createUser(data: {
  name: string
  email: string
  password: string
  role: string
}): Promise<{ error?: string }> {
  await requireAdmin()

  const existing = await prisma.user.findUnique({ where: { email: data.email.trim().toLowerCase() } })
  if (existing) return { error: "A user with that email already exists." }

  const hashed = await bcrypt.hash(data.password, 12)
  await prisma.user.create({
    data: {
      name: data.name.trim() || null,
      email: data.email.trim().toLowerCase(),
      password: hashed,
      role: data.role as any,
    },
  })

  revalidatePath("/settings")
  return {}
}
