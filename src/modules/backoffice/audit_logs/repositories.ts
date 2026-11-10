import { db } from '../../../config/database';
import { fetchResourceByPage } from '../../../shared/helpers';
import AuditQuery from './query';
import { ACTION_LABELS, CATEGORY_MODULES, actionLabel } from './labels';

export interface AuditQueryInput {
  page: string;
  limit: string | 'none';
  search?: string;
  action?: string;
  actor_id?: string;
  entity_type?: string;
  category?: 'moderation' | 'admin' | 'views';
  from?: string;
  to?: string;
}

const parse = (value: unknown) => (typeof value === 'string' ? JSON.parse(value) : value) as Record<string, any> | null;

const toEntry = (row: any) => {
  const after = parse(row.after_summary) ?? {};
  const before = parse(row.before_summary) ?? {};
  return {
    id: row.id,
    action: row.action,
    action_label: actionLabel(row.action),
    module: row.module,
    actor: row.actor_admin_id ? { id: row.actor_admin_id, name: row.actor_name ?? row.actor_email ?? '' } : null,
    target: row.entity_type
      ? { type: row.entity_type, reference: row.entity_reference, name: row.target_name ?? null }
      : null,
    reason: after.reason ?? after.notes ?? after.message ?? null,
    before,
    after,
    ip: row.origin_ip,
    created_at: row.created_at,
  };
};

export class AuditLogRepositoryImpl {
  public async fetchLogs(query: AuditQueryInput): Promise<[any, any[]]> {
    const [meta, rows] = await fetchResourceByPage({
      page: query.page,
      limit: query.limit,
      getResources: AuditQuery.fetchLogs,
      params: [
        query.search ?? '',
        query.action ?? null,
        query.actor_id ?? null,
        query.entity_type ?? null,
        query.category ? CATEGORY_MODULES[query.category] : null,
        query.from ?? null,
        query.to ?? null,
      ],
    });
    return [meta, rows.map(toEntry)];
  };

  public async filters() {
    const [actions, actors] = await Promise.all([
      db.manyOrNone(AuditQuery.actions),
      db.manyOrNone(AuditQuery.actors),
    ]);
    const known = new Set([...Object.keys(ACTION_LABELS), ...actions.map((row) => row.action)]);
    return {
      actions: [...known].map((action) => ({ value: action, label: actionLabel(action) }))
        .sort((a, b) => a.label.localeCompare(b.label)),
      actors: actors.map((row) => ({ id: row.id, name: row.name ?? row.email })),
      categories: [
        { value: 'moderation', label: 'Moderation' },
        { value: 'admin', label: 'Admin & access' },
        { value: 'views', label: 'Profile views' },
      ],
    };
  };
}

const auditLogRepository = new AuditLogRepositoryImpl();

export default auditLogRepository;
