"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

type SessionUser = { id: string; role: string }

async function getUser(): Promise<SessionUser> {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error("Unauthorized")
  return session.user as SessionUser
}

function assertLeader(role: string) {
  if (role !== "LEADERSHIP" && role !== "ADMIN") throw new Error("Leadership role required")
}

// ─── Stage 1 ────────────────────────────────────────────────────────────────

type Stage1Input = {
  name: string
  problemStatement: string
  missionAlignment: boolean
  nicheFit: boolean
  tenYearAlignment: boolean
  coreValueName: string
  noCoreValueViolated: boolean
  goalId: string | null
  isStrategicException: boolean
  strategicExceptionNote: string
  noDistractionRisk: boolean
}

const PROJECT_LIMIT = 3

async function countActiveProjects(userId: string): Promise<number> {
  return prisma.project.count({
    where: {
      proposedById: userId,
      status: { in: ["ACTIVE", "PARKED"] },
    },
  })
}

export async function createProject(data: Stage1Input): Promise<{ error: string } | void> {
  const { id: userId, role } = await getUser()

  if (role !== "ADMIN") {
    const active = await countActiveProjects(userId)
    if (active >= PROJECT_LIMIT) {
      return { error: `You've reached the ${PROJECT_LIMIT}-project limit. A project must be retired before you can submit a new one.` }
    }
  }

  const project = await prisma.project.create({
    data: {
      name: data.name,
      proposedById: userId,
      currentStage: 1,
      stage1: {
        create: {
          problemStatement: data.problemStatement,
          missionAlignment: data.missionAlignment,
          nicheFit: data.nicheFit,
          tenYearAlignment: data.tenYearAlignment,
          coreValueName: data.coreValueName,
          noCoreValueViolated: data.noCoreValueViolated,
          goalId: data.goalId || null,
          isStrategicException: data.isStrategicException,
          strategicExceptionNote: data.strategicExceptionNote || null,
          noDistractionRisk: data.noDistractionRisk,
          completedAt: new Date(),
        },
      },
    },
  })

  redirect(`/projects/${project.id}`)
}

export async function deleteProject(projectId: string) {
  await getUser()
  await prisma.project.delete({ where: { id: projectId } })
  redirect("/")
}

export async function advanceFromStage1(projectId: string) {
  const { role } = await getUser()
  assertLeader(role)
  await prisma.project.update({ where: { id: projectId }, data: { currentStage: 2 } })
  redirect(`/projects/${projectId}`)
}

export async function updateStage1(
  projectId: string,
  projectName: string,
  data: Omit<Stage1Input, "name">
): Promise<{ error?: string } | void> {
  const { role } = await getUser()
  if (role !== "ADMIN") return { error: "Admin role required" }

  await prisma.$transaction([
    prisma.project.update({
      where: { id: projectId },
      data: { name: projectName.trim() },
    }),
    prisma.stage1Data.update({
      where: { projectId },
      data: {
        problemStatement: data.problemStatement,
        missionAlignment: data.missionAlignment,
        nicheFit: data.nicheFit,
        tenYearAlignment: data.tenYearAlignment,
        coreValueName: data.coreValueName,
        noCoreValueViolated: data.noCoreValueViolated,
        goalId: data.goalId || null,
        isStrategicException: data.isStrategicException,
        strategicExceptionNote: data.strategicExceptionNote || null,
        noDistractionRisk: data.noDistractionRisk,
      },
    }),
  ])

  revalidatePath(`/projects/${projectId}`)
}

// ─── Stage 2 ────────────────────────────────────────────────────────────────

type Stage2DraftInput = {
  description: string
  expectedOutcome: string
  targetAudience: string
  oneTimeCost: string
  ongoingCost: string
  revenueOrSavings: string
  fundingSource: string
  staffHoursLaunch: string
  staffHoursSustain: string
  noStaffDisruption: boolean
  newStaffingNote: string
  spaceRequired: string
  equipmentRequired: string
  noResourceConflict: boolean
  estimatedLaunchDate: string
  isWithin90Days: boolean
}

export async function saveStage2Draft(projectId: string, data: Stage2DraftInput) {
  await getUser()

  await prisma.stage2Data.upsert({
    where: { projectId },
    create: {
      projectId,
      ...data,
      fundingSource: data.fundingSource as any,
      newStaffingNote: data.newStaffingNote || null,
      quarterlyMilestones: null,
      // Initialize score fields to 0 until leaders score
      scoreStratAlignment: 0,
      scoreImpact: 0,
      scoreFeasibility: 0,
      scoreCompetency: 0,
      scoreRisk: 0,
      scoreTimeToImpact: 0,
      scoreTotal: 0,
    },
    update: {
      // Only update the draft fields — never overwrite scored values
      description: data.description,
      expectedOutcome: data.expectedOutcome,
      targetAudience: data.targetAudience,
      oneTimeCost: data.oneTimeCost,
      ongoingCost: data.ongoingCost,
      revenueOrSavings: data.revenueOrSavings,
      fundingSource: data.fundingSource as any,
      staffHoursLaunch: data.staffHoursLaunch,
      staffHoursSustain: data.staffHoursSustain,
      noStaffDisruption: data.noStaffDisruption,
      newStaffingNote: data.newStaffingNote || null,
      spaceRequired: data.spaceRequired,
      equipmentRequired: data.equipmentRequired,
      noResourceConflict: data.noResourceConflict,
      estimatedLaunchDate: data.estimatedLaunchDate,
      isWithin90Days: data.isWithin90Days,
    },
  })
  // No redirect — client calls router.refresh()
}

type LeaderScoreInput = {
  scoreStratAlignment: number
  scoreImpact: number
  scoreFeasibility: number
  scoreCompetency: number
  scoreRisk: number
  scoreTimeToImpact: number
}

export async function submitLeaderScore(projectId: string, scores: LeaderScoreInput) {
  const { id: userId, role } = await getUser()
  assertLeader(role)

  const stage2 = await prisma.stage2Data.findUnique({ where: { projectId } })
  if (!stage2) throw new Error("Stage 2 info not yet saved")

  await prisma.stage2Score.upsert({
    where: { stage2Id_userId: { stage2Id: stage2.id, userId } },
    create: { stage2Id: stage2.id, userId, ...scores },
    update: { ...scores },
  })

  // Check if all leaders/admins have now scored
  const [allLeaders, allScores] = await Promise.all([
    prisma.user.findMany({ where: { role: { in: ["LEADERSHIP", "ADMIN"] } } }),
    prisma.stage2Score.findMany({ where: { stage2Id: stage2.id } }),
  ])

  if (allScores.length >= allLeaders.length && allLeaders.length > 0) {
    const avg = (key: keyof LeaderScoreInput) =>
      allScores.reduce((sum, s) => sum + s[key], 0) / allScores.length

    const scoreTotal =
      Math.round((
        avg("scoreStratAlignment") * 0.25 +
        avg("scoreImpact") * 0.2 +
        avg("scoreFeasibility") * 0.2 +
        avg("scoreCompetency") * 0.15 +
        avg("scoreRisk") * 0.1 +
        avg("scoreTimeToImpact") * 0.1
      ) * 100) / 100

    await prisma.$transaction([
      prisma.stage2Data.update({
        where: { id: stage2.id },
        data: {
          scoreStratAlignment: avg("scoreStratAlignment"),
          scoreImpact: avg("scoreImpact"),
          scoreFeasibility: avg("scoreFeasibility"),
          scoreCompetency: avg("scoreCompetency"),
          scoreRisk: avg("scoreRisk"),
          scoreTimeToImpact: avg("scoreTimeToImpact"),
          scoreTotal,
          completedAt: new Date(),
        },
      }),
      prisma.project.update({
        where: { id: projectId },
        data: { status: scoreTotal < 2.5 ? "PARKED" : "ACTIVE" },
      }),
    ])
  }
}

export async function advanceFromStage2(projectId: string) {
  const { role } = await getUser()
  assertLeader(role)

  const stage2 = await prisma.stage2Data.findUnique({ where: { projectId } })
  if (!stage2?.completedAt) throw new Error("Not all leaders have scored yet")
  if ((stage2.scoreTotal ?? 0) < 3.5) throw new Error("Score does not qualify for advancement")

  await prisma.project.update({ where: { id: projectId }, data: { currentStage: 3 } })
  redirect(`/projects/${projectId}`)
}

// ─── Stage 3 ────────────────────────────────────────────────────────────────

type Stage3Input = {
  ownerName: string
  ownerGetsIt: boolean
  ownerWantsIt: boolean
  ownerHasCapacity: boolean
  projectStatement: string
  definitionOfDone: string
  month1Milestone: string
  month1Metric: string
  month1Target: string
  month2Milestone: string
  month2Metric: string
  month2Target: string
  month3Milestone: string
  month3Metric: string
  month3Target: string
  budgetConfirmed: boolean
  spaceConfirmed: boolean
  equipmentConfirmed: boolean
  staffHoursConfirmed: boolean
  topRisks: string
  contingencyPlan: string
}

export async function saveStage3Draft(projectId: string, data: Stage3Input) {
  await getUser()
  await prisma.stage3Data.upsert({
    where: { projectId },
    create: { projectId, ...data },
    update: { ...data },
  })
}

export async function saveStage3(projectId: string, data: Stage3Input) {
  const { role } = await getUser()
  assertLeader(role)

  await prisma.$transaction([
    prisma.stage3Data.upsert({
      where: { projectId },
      create: { projectId, ...data, completedAt: new Date() },
      update: { ...data, completedAt: new Date() },
    }),
    prisma.project.update({
      where: { id: projectId },
      data: { currentStage: 4, stage4: { create: {} } },
    }),
  ])

  redirect(`/projects/${projectId}`)
}

// ─── Stage 4 ────────────────────────────────────────────────────────────────

type WeeklyUpdateInput = {
  stage4Id: string
  weekOf: string
  status: "ON_TRACK" | "OFF_TRACK"
  notes: string
  todoItem: string
  metricValue: string
  issues: string
}

export async function addWeeklyUpdate(projectId: string, data: WeeklyUpdateInput) {
  await getUser()

  await prisma.weeklyUpdate.create({
    data: {
      stage4Id: data.stage4Id,
      weekOf: data.weekOf,
      status: data.status,
      notes: data.notes || null,
      todoItem: data.todoItem || null,
      metricValue: data.metricValue || null,
      issues: data.issues || null,
    },
  })

  redirect(`/projects/${projectId}`)
}

export async function completeStage4(projectId: string, completionReport: string) {
  const { role } = await getUser()
  assertLeader(role)

  await prisma.$transaction([
    prisma.stage4Data.update({
      where: { projectId },
      data: { completionReport, completedAt: new Date() },
    }),
    prisma.project.update({
      where: { id: projectId },
      data: { currentStage: 5 },
    }),
  ])

  redirect(`/projects/${projectId}`)
}

// ─── Stage 5 ────────────────────────────────────────────────────────────────

type Stage5Input = {
  definitionOfDoneReview: string
  scorecardSummary: string
  financialImpact: string
  missionImpact: string
  operationalImpact: string
  lessonsLearned: string
  nextStepDecision: string
  processDocumentation: string
}

const NEXT_STEP_STATUS: Record<string, "ACTIVE" | "ARCHIVED" | "KILLED"> = {
  RETIRE: "ARCHIVED",
  SUSTAIN: "ARCHIVED",
  EXPAND: "ARCHIVED",
  CARRY: "ACTIVE",
  KILL: "KILLED",
}

export async function saveStage5Draft(projectId: string, data: Stage5Input) {
  await getUser()
  await prisma.stage5Data.upsert({
    where: { projectId },
    create: {
      projectId,
      ...(data as any),
      nextStepDecision: data.nextStepDecision as any,
      processDocumentation: data.processDocumentation || null,
    },
    update: {
      ...(data as any),
      nextStepDecision: data.nextStepDecision as any,
      processDocumentation: data.processDocumentation || null,
    },
  })
}

export async function saveStage5(projectId: string, data: Stage5Input) {
  const { role } = await getUser()
  assertLeader(role)

  const finalStatus = NEXT_STEP_STATUS[data.nextStepDecision] ?? "ARCHIVED"

  await prisma.$transaction([
    prisma.stage5Data.upsert({
      where: { projectId },
      create: {
        projectId,
        ...(data as any),
        nextStepDecision: data.nextStepDecision as any,
        processDocumentation: data.processDocumentation || null,
        completedAt: new Date(),
      },
      update: {
        ...(data as any),
        nextStepDecision: data.nextStepDecision as any,
        processDocumentation: data.processDocumentation || null,
        completedAt: new Date(),
      },
    }),
    prisma.project.update({
      where: { id: projectId },
      data: { status: finalStatus },
    }),
  ])

  redirect(`/projects/${projectId}`)
}
