import { Queryable } from './db';

export interface AuditEntry {
  actorId: string | null;
  action: string;
  module: string;
  entityType: string | null;
  entityReference: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  ip?: string | null;
}

/** Writes one row to audit_logs. Every admin-portal action goes through here. */
export const writeAudit = (t: Queryable, entry: AuditEntry): Promise<null> => t.none(
  `INSERT INTO audit_logs (
     actor_admin_id, action, module, entity_type, entity_reference,
     before_summary, after_summary, origin_application, origin_ip
   ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'Admin Portal', $8);`,
  [
    entry.actorId,
    entry.action,
    entry.module,
    entry.entityType,
    entry.entityReference,
    entry.before ? JSON.stringify(entry.before) : null,
    entry.after ? JSON.stringify(entry.after) : null,
    entry.ip ?? null,
  ],
);
