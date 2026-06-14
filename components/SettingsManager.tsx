"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  addCoreValue, deleteCoreValue,
  updateMission, updateTenYearTarget, updatePillarTitle, updateYearPlanTitle,
  addGoal, updateGoal, deleteGoal,
  updateUserRole, createUser,
} from "@/app/actions/settings"

type CoreValue = { id: string; name: string }
type UserRecord = { id: string; name: string | null; email: string; role: string }

type Goal = { id: string; title: string; order: number }
type YearPlan = { id: string; title: string; goals: Goal[] }
type Pillar = { id: string; title: string; order: number; yearPlan: YearPlan | null }
type Plan = { id: string; mission: string; tenYearTarget: string; pillars: Pillar[] }

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Admin" },
  { value: "LEADERSHIP", label: "Leadership" },
  { value: "STAFF", label: "Staff" },
]

const MAX_GOALS = 7

const PILLAR_ACCENTS = [
  { border: "border-orange-200", header: "bg-orange-50", label: "text-orange-600", dot: "bg-orange-500" },
  { border: "border-blue-200",   header: "bg-blue-50",   label: "text-blue-600",   dot: "bg-blue-500"   },
  { border: "border-violet-200", header: "bg-violet-50", label: "text-violet-600", dot: "bg-violet-500" },
]

export function SettingsManager({
  coreValues,
  strategicPlan,
  users,
  currentUserId,
}: {
  coreValues: CoreValue[]
  strategicPlan: Plan
  users: UserRecord[]
  currentUserId: string
}) {
  const router = useRouter()

  // Core values state
  const [newValue, setNewValue] = useState("")
  const [addingValue, setAddingValue] = useState(false)
  const [deletingValueId, setDeletingValueId] = useState<string | null>(null)

  // Strategic plan state
  const [missionDraft, setMissionDraft] = useState(strategicPlan.mission)
  const [savingMission, setSavingMission] = useState(false)

  const [tenYearDraft, setTenYearDraft] = useState(strategicPlan.tenYearTarget)
  const [savingTenYear, setSavingTenYear] = useState(false)

  const [pillarDrafts, setPillarDrafts] = useState<Record<string, string>>(
    Object.fromEntries(strategicPlan.pillars.map((p) => [p.id, p.title]))
  )
  const [savingPillarId, setSavingPillarId] = useState<string | null>(null)

  const [planDrafts, setPlanDrafts] = useState<Record<string, string>>(
    Object.fromEntries(
      strategicPlan.pillars.flatMap((p) =>
        p.yearPlan ? [[p.yearPlan.id, p.yearPlan.title]] : []
      )
    )
  )
  const [savingPlanId, setSavingPlanId] = useState<string | null>(null)

  const [newGoalDrafts, setNewGoalDrafts] = useState<Record<string, string>>({})
  const [addingGoalPlanId, setAddingGoalPlanId] = useState<string | null>(null)
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null)
  const [editingGoalDraft, setEditingGoalDraft] = useState("")
  const [savingGoalId, setSavingGoalId] = useState<string | null>(null)
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null)

  // Users state
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null)
  const [showAddUser, setShowAddUser] = useState(false)
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "STAFF" })
  const [addingUser, setAddingUser] = useState(false)
  const [addUserError, setAddUserError] = useState("")

  // ─── Core Values ─────────────────────────────────────────────────────────

  async function handleAddValue() {
    if (!newValue.trim()) return
    setAddingValue(true)
    await addCoreValue(newValue)
    setNewValue("")
    setAddingValue(false)
    router.refresh()
  }

  async function handleDeleteValue(id: string) {
    setDeletingValueId(id)
    await deleteCoreValue(id)
    setDeletingValueId(null)
    router.refresh()
  }

  // ─── Strategic Plan ───────────────────────────────────────────────────────

  async function handleSaveMission() {
    setSavingMission(true)
    await updateMission(missionDraft)
    setSavingMission(false)
    router.refresh()
  }

  async function handleSaveTenYear() {
    setSavingTenYear(true)
    await updateTenYearTarget(tenYearDraft)
    setSavingTenYear(false)
    router.refresh()
  }

  async function handleSavePillar(pillarId: string) {
    setSavingPillarId(pillarId)
    await updatePillarTitle(pillarId, pillarDrafts[pillarId] ?? "")
    setSavingPillarId(null)
    router.refresh()
  }

  async function handleSavePlan(planId: string) {
    setSavingPlanId(planId)
    await updateYearPlanTitle(planId, planDrafts[planId] ?? "")
    setSavingPlanId(null)
    router.refresh()
  }

  async function handleAddGoal(planId: string) {
    const title = newGoalDrafts[planId]?.trim()
    if (!title) return
    setAddingGoalPlanId(planId)
    await addGoal(planId, title)
    setNewGoalDrafts((d) => ({ ...d, [planId]: "" }))
    setAddingGoalPlanId(null)
    router.refresh()
  }

  async function handleSaveGoal(goalId: string) {
    if (!editingGoalDraft.trim()) return
    setSavingGoalId(goalId)
    await updateGoal(goalId, editingGoalDraft)
    setEditingGoalId(null)
    setSavingGoalId(null)
    router.refresh()
  }

  async function handleDeleteGoal(goalId: string) {
    setDeletingGoalId(goalId)
    await deleteGoal(goalId)
    setDeletingGoalId(null)
    router.refresh()
  }

  // ─── Users ────────────────────────────────────────────────────────────────

  async function handleAddUser() {
    if (!newUser.email.trim() || !newUser.password) return
    setAddingUser(true)
    setAddUserError("")
    const result = await createUser(newUser)
    if (result.error) {
      setAddUserError(result.error)
      setAddingUser(false)
      return
    }
    setNewUser({ name: "", email: "", password: "", role: "STAFF" })
    setShowAddUser(false)
    setAddingUser(false)
    router.refresh()
  }

  async function handleRoleChange(userId: string, newRole: string) {
    setUpdatingRoleId(userId)
    await updateUserRole(userId, newRole)
    setUpdatingRoleId(null)
    router.refresh()
  }

  return (
    <div className="space-y-8">

      {/* ─── Team Members ───────────────────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="mb-5">
          <h2 className="font-semibold text-gray-900">Team Members</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Assign roles to control what each member can do.
          </p>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2.5 space-y-1 flex-1 mr-3">
            <p><span className="font-semibold text-gray-700">Admin</span> — full access including settings</p>
            <p><span className="font-semibold text-gray-700">Leadership</span> — score Stage 2, advance all stages</p>
            <p><span className="font-semibold text-gray-700">Staff</span> — submit projects, fill stage information</p>
          </div>
          <button
            onClick={() => { setShowAddUser((s) => !s); setAddUserError("") }}
            className="shrink-0 bg-orange-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-orange-700 transition-colors"
          >
            {showAddUser ? "Cancel" : "+ Add User"}
          </button>
        </div>

        {showAddUser && (
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 mb-4 space-y-3">
            <p className="text-sm font-semibold text-gray-700">New User</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser((u) => ({ ...u, name: e.target.value }))}
                  placeholder="Full name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser((u) => ({ ...u, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {ROLE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser((u) => ({ ...u, email: e.target.value }))}
                placeholder="user@makesantafe.org"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Temporary Password</label>
              <input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser((u) => ({ ...u, password: e.target.value }))}
                placeholder="They can change it after signing in"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            {addUserError && <p className="text-xs text-red-600">{addUserError}</p>}
            <button
              onClick={handleAddUser}
              disabled={!newUser.email.trim() || !newUser.password || addingUser}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-40 transition-colors"
            >
              {addingUser ? "Creating…" : "Create User"}
            </button>
          </div>
        )}

        <ul className="space-y-2">
          {users.map((user) => {
            const isSelf = user.id === currentUserId
            return (
              <li key={user.id} className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-lg gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {user.name ?? user.email}
                    {isSelf && <span className="ml-1.5 text-xs text-gray-400">(you)</span>}
                  </p>
                  {user.name && <p className="text-xs text-gray-400 truncate">{user.email}</p>}
                </div>
                <select
                  value={user.role}
                  disabled={isSelf || updatingRoleId === user.id}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                  {ROLE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </li>
            )
          })}
        </ul>
      </section>

      {/* ─── Core Values ────────────────────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="mb-5">
          <h2 className="font-semibold text-gray-900">Core Values</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Appear as checkboxes in Stage 1 (Core Values Check).
          </p>
        </div>

        {coreValues.length === 0 ? (
          <p className="text-sm text-gray-400 mb-4">No core values added yet.</p>
        ) : (
          <ul className="space-y-2 mb-5">
            {coreValues.map((cv) => (
              <li key={cv.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-800">{cv.name}</span>
                <button
                  onClick={() => handleDeleteValue(cv.id)}
                  disabled={deletingValueId === cv.id}
                  className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40 text-lg leading-none px-1"
                  aria-label="Delete"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddValue()}
            placeholder="e.g. Access"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          <button
            onClick={handleAddValue}
            disabled={!newValue.trim() || addingValue}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-40 transition-colors whitespace-nowrap"
          >
            {addingValue ? "Adding…" : "Add Value"}
          </button>
        </div>
      </section>

      {/* ─── Strategic Plan ──────────────────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="font-semibold text-gray-900">Strategic Plan</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Define the 10-year target, 3-year pillars, and annual goals. Goals appear in project submissions as quarterly rock targets.
          </p>
        </div>

        {/* Mission */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Mission
          </label>
          <textarea
            value={missionDraft}
            onChange={(e) => setMissionDraft(e.target.value)}
            rows={2}
            placeholder="e.g. Democratize access to making and creative tools in Santa Fe…"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
          />
          <button
            onClick={handleSaveMission}
            disabled={savingMission || missionDraft === strategicPlan.mission}
            className="mt-2 bg-orange-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-40 transition-colors"
          >
            {savingMission ? "Saving…" : "Save"}
          </button>
        </div>

        {/* 10-Year Target */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            10-Year Target
          </label>
          <textarea
            value={tenYearDraft}
            onChange={(e) => setTenYearDraft(e.target.value)}
            rows={2}
            placeholder="e.g. Make Santa Fe is the premier community makerspace in the Southwest with 500+ active members…"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
          />
          <button
            onClick={handleSaveTenYear}
            disabled={savingTenYear || tenYearDraft === strategicPlan.tenYearTarget}
            className="mt-2 bg-orange-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-40 transition-colors"
          >
            {savingTenYear ? "Saving…" : "Save"}
          </button>
        </div>

        {/* Pillars */}
        <div className="space-y-6">
          {strategicPlan.pillars.map((pillar, i) => {
            const accent = PILLAR_ACCENTS[i] ?? PILLAR_ACCENTS[0]
            const yp = pillar.yearPlan

            return (
              <div key={pillar.id} className={`border rounded-xl overflow-hidden ${accent.border}`}>
                {/* Pillar header */}
                <div className={`px-4 py-3 border-b ${accent.header} ${accent.border}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2 h-2 rounded-full ${accent.dot}`} />
                    <span className={`text-xs font-semibold uppercase tracking-wide ${accent.label}`}>
                      3-Year Pillar {i + 1}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={pillarDrafts[pillar.id] ?? ""}
                      onChange={(e) =>
                        setPillarDrafts((d) => ({ ...d, [pillar.id]: e.target.value }))
                      }
                      placeholder="Pillar title…"
                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <button
                      onClick={() => handleSavePillar(pillar.id)}
                      disabled={
                        savingPillarId === pillar.id ||
                        (pillarDrafts[pillar.id] ?? "") === pillar.title
                      }
                      className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-xs font-medium hover:bg-orange-700 disabled:opacity-40 transition-colors whitespace-nowrap"
                    >
                      {savingPillarId === pillar.id ? "Saving…" : "Save"}
                    </button>
                  </div>
                </div>

                {/* 1-Year Plan */}
                {yp && (
                  <div className="p-4 bg-white space-y-4">
                    {/* Plan title */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                        1-Year Plan Title
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={planDrafts[yp.id] ?? ""}
                          onChange={(e) =>
                            setPlanDrafts((d) => ({ ...d, [yp.id]: e.target.value }))
                          }
                          placeholder="Plan title…"
                          className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <button
                          onClick={() => handleSavePlan(yp.id)}
                          disabled={
                            savingPlanId === yp.id ||
                            (planDrafts[yp.id] ?? "") === yp.title
                          }
                          className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-xs font-medium hover:bg-orange-700 disabled:opacity-40 transition-colors whitespace-nowrap"
                        >
                          {savingPlanId === yp.id ? "Saving…" : "Save"}
                        </button>
                      </div>
                    </div>

                    {/* Goals */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Goals
                        </label>
                        <span className="text-xs text-gray-400">
                          {yp.goals.length}/{MAX_GOALS}
                        </span>
                      </div>

                      {yp.goals.length > 0 && (
                        <ul className="space-y-2 mb-3">
                          {yp.goals.map((goal) => (
                            <li key={goal.id} className="flex items-start gap-2 bg-gray-50 rounded-lg px-3 py-2">
                              <span className="text-xs font-bold text-gray-400 mt-0.5 shrink-0 w-4">
                                {goal.order}.
                              </span>
                              {editingGoalId === goal.id ? (
                                <div className="flex-1 flex gap-2">
                                  <input
                                    type="text"
                                    value={editingGoalDraft}
                                    onChange={(e) => setEditingGoalDraft(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleSaveGoal(goal.id)
                                      if (e.key === "Escape") setEditingGoalId(null)
                                    }}
                                    autoFocus
                                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                  />
                                  <button
                                    onClick={() => handleSaveGoal(goal.id)}
                                    disabled={savingGoalId === goal.id}
                                    className="px-2 py-1 bg-orange-600 text-white rounded text-xs font-medium hover:bg-orange-700 disabled:opacity-40"
                                  >
                                    {savingGoalId === goal.id ? "…" : "Save"}
                                  </button>
                                  <button
                                    onClick={() => setEditingGoalId(null)}
                                    className="px-2 py-1 text-gray-400 hover:text-gray-600 text-xs"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <span className="flex-1 text-sm text-gray-800 leading-snug">
                                    {goal.title}
                                  </span>
                                  <button
                                    onClick={() => {
                                      setEditingGoalId(goal.id)
                                      setEditingGoalDraft(goal.title)
                                    }}
                                    className="text-gray-400 hover:text-gray-600 text-xs shrink-0"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteGoal(goal.id)}
                                    disabled={deletingGoalId === goal.id}
                                    className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40 text-lg leading-none shrink-0"
                                    aria-label="Delete"
                                  >
                                    ×
                                  </button>
                                </>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}

                      {yp.goals.length < MAX_GOALS && (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newGoalDrafts[yp.id] ?? ""}
                            onChange={(e) =>
                              setNewGoalDrafts((d) => ({ ...d, [yp.id]: e.target.value }))
                            }
                            onKeyDown={(e) => e.key === "Enter" && handleAddGoal(yp.id)}
                            placeholder="Add a goal…"
                            className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                          <button
                            onClick={() => handleAddGoal(yp.id)}
                            disabled={!newGoalDrafts[yp.id]?.trim() || addingGoalPlanId === yp.id}
                            className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-xs font-medium hover:bg-orange-700 disabled:opacity-40 transition-colors whitespace-nowrap"
                          >
                            {addingGoalPlanId === yp.id ? "Adding…" : "+ Add Goal"}
                          </button>
                        </div>
                      )}

                      {yp.goals.length >= MAX_GOALS && (
                        <p className="text-xs text-gray-400 italic">Maximum of {MAX_GOALS} goals reached.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

    </div>
  )
}
