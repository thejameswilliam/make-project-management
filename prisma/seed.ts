import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@makesantafe.org"
  const password = process.env.SEED_ADMIN_PASSWORD ?? "changeme!"
  const name = process.env.SEED_ADMIN_NAME ?? "Make Admin"

  const existing = await prisma.user.findUnique({ where: { email } })

  if (existing) {
    console.log(`User ${email} already exists, skipping.`)
    return
  }

  const hashed = await bcrypt.hash(password, 12)

  await prisma.user.create({
    data: { email, password: hashed, name, role: "ADMIN" },
  })

  console.log(`Created admin user: ${email}`)
  console.log(`Password: ${password}`)
  console.log("Change this password after first login!")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
