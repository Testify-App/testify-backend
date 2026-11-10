import { Request } from 'express';
import { User } from '../../../../shared/interface';

/** Who is acting, for audit entries and "performed by" columns. */
export interface ActorContext {
  adminId: string;
  adminName: string;
  ip: string | null;
}

export const actorContext = (req: Request): ActorContext => {
  const user = (req as any).user as User;
  return {
    adminId: user.id,
    adminName: `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || 'An administrator',
    // Express trusts one proxy hop (CloudFront), so req.ip is the viewer's address.
    ip: req.ip ?? null,
  };
};
