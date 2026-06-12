"use client"

import { useState } from "react"
import { StagePanelHeader, Section, CheckRow } from "./shared"
import type { Stage1Data } from "@prisma/client"

export function Stage1Panel({ data }: { data: Stage1Data }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-white rounded-xl border border-gray-200 mb-4 overflow-hidden">
      <StagePanelHeader
        stageNum={1}
        title="Pitch and Propose"
        state="completed"
        completedAt={data.completedAt}
        isExpanded={expanded}
        onToggle={() => setExpanded((e) => !e)}
      />

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">
          <Section label="Problem / Opportunity Statement">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{data.problemStatement}</p>
          </Section>
          <Section label="Core Focus Filter">
            <div className="space-y-1.5">
              <CheckRow checked={data.missionAlignment} label="Mission alignment" />
              <CheckRow checked={data.nicheFit} label="Niche fit" />
              <CheckRow checked={data.tenYearAlignment} label="10-Year Target alignment" />
            </div>
          </Section>
          <Section label="Core Values">
            <CheckRow
              checked={data.noCoreValueViolated}
              label={`Embodies "${data.coreValueName}" · No Core Value violated`}
            />
          </Section>
          <Section label="1-Year Plan Relevance">
            {data.isStrategicException ? (
              <div>
                <span className="inline-block text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-medium mb-1.5">
                  Strategic Exception
                </span>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{data.strategicExceptionNote}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{data.oneYearPlanGoal}</p>
            )}
          </Section>
          <Section label="Distraction Risk">
            <CheckRow checked={data.noDistractionRisk} label="No existing projects will be abandoned" />
          </Section>
        </div>
      )}
    </div>
  )
}
