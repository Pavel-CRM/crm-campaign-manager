import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      subscriptionStatus: string
      trialEndsAt: string | null
      subscriptionEndsAt: string | null
      isAdmin: boolean
    } & DefaultSession['user']
  }
}
