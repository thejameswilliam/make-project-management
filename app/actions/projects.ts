"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

// ─── Stage 1 ────────────────────────────────────────────────────────────────

type Stage1Input = {
  name: string
  problemStatement: string
  missionAlignment: boolean
  nicheFit: boolean
  tenYearAlignment: boolean
  coreValueName: string
  noCoreValueViolated: boolean
  oneYearPlanGoal: string
  isStrategicException: boolean
  strategicExceptionNote: string
  noDistractionRisk: boolean
}

export async function createProject(data: Stage1Input) {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error("Unauthorized")
  const userId = (session.user as { id: string }).id

  const project = await prisma.project.create({
    data: {
      name: data.name,
      proposedById: userId,
      stage1: {
        create: {
          problemStatement: data.problemStatement,
          missionAlignment: data.missionAlignment,
          nicheFit: data.nicheFit,
          tenYearAlignment: data.tenYearAlignment,
          coreValueName: data.coreValueName,
          noCoreValueViolated: data.noCoreValueViolated,
          oneYearPlanGoal: data.oneYearPlanGoal || null,
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

// ─── Stage 2 ────────────────────────────────────────────────────────────────

type Stage2Input = {
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
  quarterlyMilestones: string
  scoreStratAlignment: number
  scoreImpact: number
  scoreFeasibility: number
  scoreCompetency: number
  scoreRisk: number
  scoreTimeToImpact: number
}

function calcScore(d: Stage2Input): number {
  return (
    d.scoreStratAlignment * 0.25 +
    d.scoreImpact * 0.2 +
    d.scoreFeasibility * 0.2 +
    d.scoreCompetency * 0.15 +
    d.scoreRisk * 0.1 +
    d.scoreTimeToImpact * 0.1
  )
}

export async function saveStage2(projectId: string, data: Stage2Input) {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error("Unauthorized")

  const scoreTotal = Math.round(calcScore(data) * 100) / 100

  await prisma.$transaction([
    prisma.stage2Data.upsert({
      where: { projectId },
      create: {
        projectId,
        ...(data as any),
        fundingSource: data.fundingSource as any,
        newStaffingNote: data.newStaffingNote || null,
        quarterlyMilestones: data.quarterlyMilestones || null,
        scoreTotal,
        completedAt: new Date(),
      },
      update: {
        ...(data as any),
        fundingSource: data.fundingSource as any,
        newStaffingNote: data.newStaffingNote || null,
        quarterlyMilestones: data.quarterlyMilestones || null,
        scoreTotal,
        completedAt: new Date(),
      },
    }),
    prisma.project.update({
      where: { id: projectId },
      data: {
        currentStage: scoreTotal >= 3.5 ? 3 : 2,
        status: scoreTotal < 2.5 ? "PARKED" : "ACTIVE",
      },
    }),
  ])

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
  month2Milestone: string
  month3Milestone: string
  scorecardMetric: string
  scorecardWeeklyTarget: string
  budgetConfirmed: boolean
  spaceConfirmed: boolean
  equipmentConfirmed: boolean
  staffHoursConfirmed: boolean
  topRisks: string
  contingencyPlan: string
}

export async function saveStage3(projectId: string, data: Stage3Input) {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error("Unauthorized")

  await prisma.$transaction([
    prisma.stage3Data.upsert({
      where: { projectId },
      create: { projectId, ...data, completedAt: new Date() },
      update: { ...data, completedAt: new Date() },
    }),
    prisma.project.update({
      where: { id: projectId },
      data: {
        currentStage: 4,
        stage4: { create: {} },
      },
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
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error("Unauthorized")

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
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error("Unauthorized")

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

export async function saveStage5(projectId: string, data: Stage5Input) {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error("Unauthorized")

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
