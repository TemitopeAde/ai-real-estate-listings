/** A site contact as shown in pickers. */
export interface ContactOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export function contactDisplayName(contact: Pick<ContactOption, 'firstName' | 'lastName' | 'email'>): string {
  return [contact.firstName, contact.lastName].filter(Boolean).join(' ') || contact.email || '—';
}
