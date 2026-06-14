import { prisma } from "@/lib/prisma"
import { getOrCreateStrategicPlan } from "@/app/actions/settings"
import Link from "next/link"

const PILLAR_COLORS = [
  {
    border: "border-orange-200",
    header: "bg-orange-50 border-orange-200",
    title: "text-orange-700",
    dot: "bg-orange-500",
    planBorder: "border-orange-100",
    goalDot: "text-orange-400",
  },
  {
    border: "border-blue-200",
    header: "bg-blue-50 border-blue-200",
    title: "text-blue-700",
    dot: "bg-blue-500",
    planBorder: "border-blue-100",
    goalDot: "text-blue-400",
  },
  {
    border: "border-violet-200",
    header: "bg-violet-50 border-violet-200",
    title: "text-violet-700",
    dot: "bg-violet-500",
    planBorder: "border-violet-100",
    goalDot: "text-violet-400",
  },
]

export default async function StrategyPage() {
  const plan = await getOrCreateStrategicPlan()

  // Fetch projects linked to goals in this plan
  const goalIds = plan.pillars.flatMap((p) =>
    (p.yearPlan?.goals ?? []).map((g) => g.id)
  )

  const linkedProjects = await prisma.stage1Data.findMany({
    where: { goalId: { in: goalIds } },
    select: {
      goalId: true,
      project: {
        select: {
          id: true,
          name: true,
          status: true,
          currentStage: true,
        },
      },
    },
  })

  const projectsByGoal = linkedProjects.reduce<
    Record<string, { id: string; name: string; status: string; currentStage: number }[]>
  >((acc, s) => {
    if (!s.goalId) return acc
    acc[s.goalId] = acc[s.goalId] ?? []
    acc[s.goalId].push(s.project)
    return acc
  }, {})

  const STATUS_DOT: Record<string, string> = {
    ACTIVE: "bg-green-400",
    PARKED: "bg-yellow-400",
    KILLED: "bg-red-400",
    ARCHIVED: "bg-gray-300",
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Strategic Plan</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          How our work today connects to where we're going.
        </p>
      </div>

      {/* 10-Year Target */}
      <div className="relative mb-2">
        <div className="bg-gray-900 text-white rounded-xl px-6 py-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
            10-Year Target
          </p>
          {plan.tenYearTarget ? (
            <p className="text-lg font-bold leading-snug">{plan.tenYearTarget}</p>
          ) : (
            <p className="text-gray-500 italic text-sm">
              Not set yet — add it in{" "}
              <Link href="/settings" className="underline hover:text-gray-300">
                Settings
              </Link>
              .
            </p>
          )}
        </div>
        {/* Connector line down from 10-year box */}
        <div className="flex justify-center">
          <div className="w-px h-6 bg-gray-300" />
        </div>
      </div>

      {/* 3-Year Pillars */}
      <div className="relative">
        {/* Horizontal connector bar across the top of pillars */}
        <div className="absolute top-0 left-[calc(16.67%)] right-[calc(16.67%)] h-px bg-gray-300" />

        <div className="grid grid-cols-3 gap-4 pt-0">
          {plan.pillars.map((pillar, i) => {
            const color = PILLAR_COLORS[i] ?? PILLAR_COLORS[0]
            const yp = pillar.yearPlan

            return (
              <div key={pillar.id} className="flex flex-col">
                {/* Connector line down from horizontal bar */}
                <div className="flex justify-center">
                  <div className="w-px h-6 bg-gray-300" />
                </div>

                {/* Pillar card */}
                <div className={`border rounded-xl overflow-hidden flex flex-col flex-1 ${color.border}`}>
                  {/* Pillar header */}
                  <div className={`border-b px-4 py-3 ${color.header}`}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${color.dot}`} />
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        3-Year Pillar {i + 1}
                      </span>
                    </div>
                    {pillar.title ? (
                      <p className={`font-bold text-sm leading-snug ${color.title}`}>
                        {pillar.title}
                      </p>
                    ) : (
                      <p className="text-gray-400 italic text-sm">Untitled pillar</p>
                    )}
                    {pillar.description && (
                      <p className="mt-1 text-xs text-gray-500 leading-snug">
                        {pillar.description}
                      </p>
                    )}
                  </div>

                  {/* 1-Year Plan */}
                  <div className="p-4 flex-1 bg-white">
                    {yp ? (
                      <>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
                          1-Year Plan
                        </p>
                        {yp.title && (
                          <p className="text-sm font-semibold text-gray-800 mb-3">{yp.title}</p>
                        )}

                        {yp.goals.length === 0 ? (
                          <p className="text-xs text-gray-400 italic">No goals added yet.</p>
                        ) : (
                          <ol className="space-y-3">
                            {yp.goals.map((goal) => {
                              const rocks = projectsByGoal[goal.id] ?? []
                              return (
                                <li key={goal.id}>
                                  <div className="flex gap-2 items-start">
                                    <span className={`text-xs font-bold mt-0.5 shrink-0 ${color.goalDot}`}>
                                      {goal.order}.
                                    </span>
                                    <span className="text-sm text-gray-800 leading-snug">
                                      {goal.title}
                                    </span>
                                  </div>

                                  {/* Quarterly rocks */}
                                  {rocks.length > 0 && (
                                    <div className="mt-2 ml-4 space-y-1">
                                      {rocks.map((project) => (
                                        <Link
                                          key={project.id}
                                          href={`/projects/${project.id}`}
                                          className="flex items-center gap-2 group"
                                        >
                                          <span
                                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[project.status] ?? "bg-gray-300"}`}
                                          />
                                          <span className="text-xs text-gray-500 group-hover:text-gray-800 transition-colors truncate">
                                            {project.name}
                                          </span>
                                        </Link>
                                      ))}
                                    </div>
                                  )}
                                </li>
                              )
                            })}
                          </ol>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No 1-year plan yet.</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-8 flex items-center gap-5 text-xs text-gray-400">
        <span className="font-medium text-gray-500">Projects:</span>
        {[
          { label: "Active", cls: "bg-green-400" },
          { label: "Parked", cls: "bg-yellow-400" },
          { label: "Killed", cls: "bg-red-400" },
          { label: "Archived", cls: "bg-gray-300" },
        ].map(({ label, cls }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${cls}`} />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
