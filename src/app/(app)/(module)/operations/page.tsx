import { redirect } from 'next/navigation';
import { routes } from '@/core/config/routes';

/** /operations has no screen of its own — the master list is the module. */
export default function OperationsIndex() {
  redirect(routes.operations.master);
}
