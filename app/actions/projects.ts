"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

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

  if (!session?.user) {
    throw new Error("Unauthorized")
  }

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
