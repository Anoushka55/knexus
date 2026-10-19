export const currentUser = {
  name: 'Anoushka Rathod',
  firstName: 'Anoushka',
  initials: 'AR',
  role: 'Incident Commander',
  notificationCount: 8,
} as const;

export const lastUpdatedLabel = 'Data as of: May 8, 2025 10:24 AM';
export const lastUpdatedTime = '10:24:30 AM';

export type CurrentUser = typeof currentUser;
