import { redirect } from 'next/navigation'

export default function OldOwnerRedirect() {
  redirect('/admin')
}
