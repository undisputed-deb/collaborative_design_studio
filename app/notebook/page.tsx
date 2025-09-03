import { redirect } from 'next/navigation';

export default function NotebookRedirect() {
  redirect('/dashboard');
}
