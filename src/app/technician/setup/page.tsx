import { redirect } from 'next/navigation';

/** Legacy route — onboarding lives at /auth/register-technician?complete=1 */
export default function TechnicianSetupPage() {
  redirect('/auth/register-technician?complete=1');
}
