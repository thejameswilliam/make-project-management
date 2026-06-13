"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateAccount } from "@/app/actions/account"

export function AccountForm({ initialName }: { initialName: string }) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccess(false)

    if (!name.trim()) { setError("Name is required."); return }
    if (newPassword && newPassword !== confirmPassword) { setError("New passwords do not match."); return }

    setSaving(true)
    const result = await updateAccount({
      name: name.trim(),
      currentPassword: currentPassword || undefined,
      newPassword: newPassword || undefined,
    })
    setSaving(false)

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 pt-6">
        <p className="text-sm font-medium text-gray-700 mb-4">Change Password</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Required only if changing password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Leave blank to keep current password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}
      {success && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">Changes saved.</p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="bg-orange-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-orange-700 disabled:opacity-40 transition-colors"
      >
        {saving ? "Saving…" : "Save Changes"}
      </button>
    </form>
  )
}
