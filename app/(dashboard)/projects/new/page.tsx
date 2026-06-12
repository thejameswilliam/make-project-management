import Link from "next/link"
import { NewProjectForm } from "@/components/NewProjectForm"

export default function NewProjectPage() {
  return (
    <div>
      <div className="mb-6">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
          ← All Projects
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-3">New Project</h1>
        <p className="text-sm text-gray-500 mt-0.5">Stage 1: Pitch and Propose</p>
      </div>
      <NewProjectForm />
    </div>
  )
}
