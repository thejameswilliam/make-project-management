"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"

const MAX_GOALS_PER_PLAN = 7
const PILLAR_COUNT = 3

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as { role?: string })?.role
  if (role !== "ADMIN") throw new Error("Admin role required")
}

// ─── Core Values ─────────────────────────────────────────────────────────────

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

// ─── Strategic Plan ───────────────────────────────────────────────────────────

export async function getOrCreateStrategicPlan() {
  let plan = await prisma.strategicPlan.findFirst({
    include: {
      pillars: {
        orderBy: { order: "asc" },
        include: {
          yearPlan: {
            include: {
              goals: { orderBy: { order: "asc" } },
            },
          },
        },
      },
    },
  })

  if (!plan) {
    plan = await prisma.strategicPlan.create({
      data: {
        tenYearTarget: "",
        pillars: {
          create: [
            { title: "Pillar 1", order: 1, yearPlan: { create: { title: "1-Year Plan" } } },
            { title: "Pillar 2", order: 2, yearPlan: { create: { title: "1-Year Plan" } } },
            { title: "Pillar 3", order: 3, yearPlan: { create: { title: "1-Year Plan" } } },
          ],
        },
      },
      include: {
        pillars: {
          orderBy: { order: "asc" },
          include: {
            yearPlan: {
              include: {
                goals: { orderBy: { order: "asc" } },
              },
            },
          },
        },
      },
    })
  }

  return plan
}

export async function updateMission(mission: string) {
  await requireAdmin()
  const plan = await prisma.strategicPlan.findFirst()
  if (!plan) throw new Error("No strategic plan found")
  await prisma.strategicPlan.update({
    where: { id: plan.id },
    data: { mission: mission.trim() },
  })
  revalidatePath("/settings")
  revalidatePath("/strategy")
}

export async function updateTenYearTarget(target: string) {
  await requireAdmin()
  const plan = await prisma.strategicPlan.findFirst()
  if (!plan) throw new Error("No strategic plan found")
  await prisma.strategicPlan.update({
    where: { id: plan.id },
    data: { tenYearTarget: target.trim() },
  })
  revalidatePath("/settings")
  revalidatePath("/strategy")
}

export async function updatePillarTitle(pillarId: string, title: string) {
  await requireAdmin()
  await prisma.threeYearPillar.update({
    where: { id: pillarId },
    data: { title: title.trim() },
  })
  revalidatePath("/settings")
  revalidatePath("/strategy")
}

export async function updatePillarDescription(pillarId: string, description: string) {
  await requireAdmin()
  await prisma.threeYearPillar.update({
    where: { id: pillarId },
    data: { description: description.trim() },
  })
  revalidatePath("/settings")
  revalidatePath("/strategy")
}

export async function updateYearPlanTitle(planId: string, title: string) {
  await requireAdmin()
  await prisma.oneYearPlan.update({
    where: { id: planId },
    data: { title: title.trim() },
  })
  revalidatePath("/settings")
  revalidatePath("/strategy")
}

export async function addGoal(planId: string, title: string) {
  await requireAdmin()
  const count = await prisma.annualGoal.count({ where: { planId } })
  if (count >= MAX_GOALS_PER_PLAN) {
    throw new Error(`Maximum of ${MAX_GOALS_PER_PLAN} goals per plan`)
  }
  await prisma.annualGoal.create({
    data: { planId, title: title.trim(), order: count + 1 },
  })
  revalidatePath("/settings")
  revalidatePath("/strategy")
}

export async function updateGoal(goalId: string, title: string) {
  await requireAdmin()
  await prisma.annualGoal.update({
    where: { id: goalId },
    data: { title: title.trim() },
  })
  revalidatePath("/settings")
  revalidatePath("/strategy")
}

export async function deleteGoal(goalId: string) {
  await requireAdmin()
  const goal = await prisma.annualGoal.findUnique({ where: { id: goalId } })
  if (!goal) return
  await prisma.annualGoal.delete({ where: { id: goalId } })
  // Re-sequence remaining goals
  const remaining = await prisma.annualGoal.findMany({
    where: { planId: goal.planId },
    orderBy: { order: "asc" },
  })
  await Promise.all(
    remaining.map((g, i) =>
      prisma.annualGoal.update({ where: { id: g.id }, data: { order: i + 1 } })
    )
  )
  revalidatePath("/settings")
  revalidatePath("/strategy")
}

// ─── Users ───────────────────────────────────────────────────────────────────

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
