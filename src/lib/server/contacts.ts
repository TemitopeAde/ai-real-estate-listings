import { contacts } from '@wix/crm';
import { auth } from '@wix/essentials';

import type { ContactOption } from '../contact-option';

type Loose = Record<string, unknown>;
const record = (value: unknown): Loose => (typeof value === 'object' && value !== null ? value as Loose : {});
const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

export function toContactOption(contact: unknown): ContactOption {
  const item = record(contact);
  const info = record(item.info);
  const name = record(info.name);
  const primary = record(item.primaryInfo);
  const emails = record(info.emails);
  const firstEmail = Array.isArray(emails.items) ? text(record(emails.items[0]).email) : '';
  return {
    id: text(item._id),
    firstName: text(name.first),
    lastName: text(name.last),
    email: text(primary.email) || firstEmail,
    phone: text(primary.phone) || undefined,
  };
}

/**
 * Site contacts for the invoice contact picker. The Contacts query has no free-text search,
 * so a search term is matched as a prefix of first name, last name or primary email.
 * With no term, returns the most recently created contacts.
 */
export async function searchContacts(search: string, limit = 20): Promise<ContactOption[]> {
  const query = () => auth.elevate(contacts.queryContacts)();
  const term = search.trim();
  if (!term) {
    const recent = await query().descending('_createdDate').limit(limit).find();
    return recent.items.map(toContactOption);
  }
  const results = await Promise.all([
    query().startsWith('info.name.first', term).limit(limit).find(),
    query().startsWith('info.name.last', term).limit(limit).find(),
    query().startsWith('primaryInfo.email', term.toLowerCase()).limit(limit).find(),
  ]);
  const seen = new Set<string>();
  const options: ContactOption[] = [];
  for (const result of results) {
    for (const contact of result.items) {
      const option = toContactOption(contact);
      if (!option.id || seen.has(option.id)) continue;
      seen.add(option.id);
      options.push(option);
    }
  }
  return options.slice(0, limit);
}

/** One contact, or null if it doesn't exist. */
export async function getContactOption(id: string): Promise<ContactOption | null> {
  try {
    return toContactOption(await auth.elevate(contacts.getContact)(id));
  } catch (error) {
    console.error('Unable to load contact.', error);
    return null;
  }
}
