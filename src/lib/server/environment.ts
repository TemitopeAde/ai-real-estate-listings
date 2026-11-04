export function isDevelopmentEnvironment(): boolean {
  return import.meta.env.WIX_ENVIRONMENT?.trim().toUpperCase() === 'DEVELOPMENT';
}
