import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user) return null

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
        if (!isPasswordValid) return null

        // Auto-grant admin + lifetime to ADMIN_EMAIL
        const adminEmail = process.env.ADMIN_EMAIL
        if (adminEmail && user.email === adminEmail && !user.isAdmin) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              isAdmin: true,
              subscriptionStatus: 'lifetime',
              subscriptionPlan: 'lifetime',
            },
          })
          user.isAdmin = true
          user.subscriptionStatus = 'lifetime'
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          subscriptionStatus: user.subscriptionStatus,
          trialEndsAt: user.trialEndsAt?.toISOString() ?? null,
          subscriptionEndsAt: user.subscriptionEndsAt?.toISOString() ?? null,
          isAdmin: user.isAdmin,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.subscriptionStatus = (user as any).subscriptionStatus
        token.trialEndsAt = (user as any).trialEndsAt
        token.subscriptionEndsAt = (user as any).subscriptionEndsAt
        token.isAdmin = (user as any).isAdmin
      }

      // Refresh subscription data on every session update
      if (trigger === 'update' || !token.subscriptionStatus) {
        const dbUser = await prisma.user.findUnique({ where: { id: token.id as string } })
        if (dbUser) {
          token.subscriptionStatus = dbUser.subscriptionStatus
          token.trialEndsAt = dbUser.trialEndsAt?.toISOString() ?? null
          token.subscriptionEndsAt = dbUser.subscriptionEndsAt?.toISOString() ?? null
          token.isAdmin = dbUser.isAdmin
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.subscriptionStatus = token.subscriptionStatus as string
        session.user.trialEndsAt = token.trialEndsAt as string | null
        session.user.subscriptionEndsAt = token.subscriptionEndsAt as string | null
        session.user.isAdmin = token.isAdmin as boolean
      }
      return session
    },
  },
}
