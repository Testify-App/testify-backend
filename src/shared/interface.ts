export interface JwtSignature {
  issuer: string;
  subject: string;
  audience: string;
};

export interface SignedData {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  password?: string;
  status?: string;
  // Backoffice (admin portal) tokens only.
  scope?: 'backoffice';
  session_id?: string;
  role_id?: string | null;
  is_root_account?: boolean;
};

export interface User {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  password?: string;
  avatar?: string;
  // Set on backoffice requests by the backoffice auth middlewares.
  session_id?: string;
  role_id?: string | null;
  is_root_account?: boolean;
};

export interface ActivityLogPayload {
  performed_by: string | number;
  activity: string;
  module: string;
  operation_id: string | number | null;
  metadata: Record<string, any> | null;
};

export type ActivityType = 'backoffice' | 'user';
