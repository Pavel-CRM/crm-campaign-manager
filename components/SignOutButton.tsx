'use client'

import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export function SignOutButton() {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="w-full text-gray-400 hover:text-white hover:bg-gray-800 flex items-center gap-2 justify-start"
    >
      <LogOut className="w-4 h-4" />
      Выйти
    </Button>
  )
}
