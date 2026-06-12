"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  addCoreValue, deleteCoreValue,
  addOneYearGoal, deleteOneYearGoal,
  updateUserRole, createUser,
} from "@/app/actions/settings"

type CoreValue = { id: string; name: string }
type OneYearGoal = { id: string; description: string }
type UserRecord = { id: string; name: string | null; email: string; role: string }

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Admin" },
  { value: "LEADERSHIP", label: "Leadership" },
  { value: "STAFF", label: "Staff" },
]

export function SettingsManager({
  coreValues,
  oneYearGoals,
  users,
  currentUserId,
}: {
  coreValues: CoreValue[]
  oneYearGoals: OneYearGoal[]
  users: UserRecord[]
  currentUserId: string
}) {
  const router = useRouter()

  const [newValue, setNewValue] = useState("")
  const [addingValue, setAddingValue] = useState(false)
  const [deletingValueId, setDeletingValueId] = useState<string | null>(null)

  const [newGoal, setNewGoal] = useState("")
  const [addingGoal, setAddingGoal] = useState(false)
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null)

  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null)

  const [showAddUser, setShowAddUser] = useState(false)
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "STAFF" })
  const [addingUser, setAddingUser] = useState(false)
  const [addUserError, setAddUserError] = useState("")

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

  async function handleAddGoal() {
    if (!newGoal.trim()) return
    setAddingGoal(true)
    await addOneYearGoal(newGoal)
    setNewGoal("")
    setAddingGoal(false)
    router.refresh()
  }

  async function handleDeleteGoal(id: string) {
    setDeletingGoalId(id)
    await deleteOneYearGoal(id)
    setDeletingGoalId(null)
    router.refresh()
  }

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

      {/* Team Members */}
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

      {/* Core Values */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="mb-5">
          <h2 className="font-semibold text-gray-900">Core Values</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Appear as checkboxes in Stage 1 Step 4 (Core Values Check).
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

      {/* 1-Year Plan Goals */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="mb-5">
          <h2 className="font-semibold text-gray-900">1-Year Plan Goals</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Appear as checkboxes in Stage 1 Step 5 (1-Year Plan Relevance).
          </p>
        </div>

        {oneYearGoals.length === 0 ? (
          <p className="text-sm text-gray-400 mb-4">No goals added yet.</p>
        ) : (
          <ul className="space-y-2 mb-5">
            {oneYearGoals.map((goal) => (
              <li key={goal.id} className="flex items-start justify-between gap-3 px-3 py-2.5 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-800">{goal.description}</span>
                <button
                  onClick={() => handleDeleteGoal(goal.id)}
                  disabled={deletingGoalId === goal.id}
                  className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40 text-lg leading-none px-1 shrink-0 mt-0.5"
                  aria-label="Delete"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="space-y-2">
          <textarea
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            placeholder="e.g. Increase active membership by 20% by December"
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
          />
          <button
            onClick={handleAddGoal}
            disabled={!newGoal.trim() || addingGoal}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-40 transition-colors"
          >
            {addingGoal ? "Adding…" : "Add Goal"}
          </button>
        </div>
      </section>

    </div>
  )
}
