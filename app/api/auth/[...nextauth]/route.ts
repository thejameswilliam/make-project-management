import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

console.log("[nextauth] NEXTAUTH_SECRET set:", !!process.env.NEXTAUTH_SECRET)
console.log("[nextauth] NODE_ENV:", process.env.NODE_ENV)

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
