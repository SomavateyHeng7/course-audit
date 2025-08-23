import { DefaultSession } from "next-auth"
import { Role } from "@prisma/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: Role
      faculty: any
      departmentId: string  // 🆕 Add departmentId to session
      advisorId: string | null
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    role: Role
    faculty: any
    departmentId: string  // 🆕 Add departmentId to user
    advisorId: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: Role
    faculty: any
    departmentId: string  // 🆕 Add departmentId to JWT
    advisorId: string | null
  }
} 
