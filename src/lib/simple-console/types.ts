export type OpsRow = Record<string, string>;

export interface AgentConsoleConfig {
  /** URL segment for the level-2 "operations" page, e.g. "queue" */
  opsSlug: string;
  /** Sidebar label for the level-2 page, e.g. "Ticket Queue" */
  opsLabel: string;
  /** lucide-react icon name used in the sidebar for the level-2 page */
  opsIcon: string;
  /** One-line description shown at the top of the level-2 page */
  opsDescription: string;
  /** Table column headers for the level-2 page */
  columns: string[];
  /** Mock rows for the level-2 table, keyed by column name */
  rows: OpsRow[];
  /** Short label used in the level-3 Reports page heading */
  reportLabel: string;
}
