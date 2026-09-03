import { EN, type DashboardMessages } from "./messages-en";

export function complete(
  overrides: Partial<DashboardMessages>,
): DashboardMessages {
  return { ...EN, ...overrides };
}
