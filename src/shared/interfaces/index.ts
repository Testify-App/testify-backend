export interface JwtSignature {
    issuer: string;
    subject: string;
    audience: string;
}

export interface SignedData {
    id: string;
    email: string;
    verified: boolean;
    first_name: string;
    last_name: string;
}