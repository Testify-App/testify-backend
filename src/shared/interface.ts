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
};

export interface User {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  password?: string;
  avatar?: string;
};

export interface File {
  fieldname?: string;
  originalname?: string;
  encoding?: string;
  mimetype: string;
  buffer: Buffer;
  size?: number;
};

export interface ActivityLogPayload {
  performed_by: string | number;
  activity: string;
  module: string;
  operation_id: string | number | null;
  metadata: Record<string, any> | null;
};

export type ActivityType = 'backoffice' | 'user';
