import { Request, Response, NextFunction } from 'express';
import { timingSafeEqual } from 'crypto';
import { StatusCodes } from 'http-status-codes';
import * as ApiResponse from '../lib/api-response';

/**
 * Second of the two independent origin protections.
 *
 * The instance's security group only admits the AWS-managed prefix list
 * `com.amazonaws.global.cloudfront.origin-facing`. That closes the origin to
 * the general public, but the list covers EVERY CloudFront customer — anyone
 * can create their own distribution, point it at origin.testifyhub.co, and
 * their traffic arrives from an address the firewall already trusts.
 *
 * Our distribution attaches a secret header to every request it forwards.
 * Requests without it did not come through our distribution, so they are
 * refused here. Neither control is sufficient on its own.
 *
 * The secret arrives as ORIGIN_VERIFY_SECRET, injected at deploy time from
 * Parameter Store (/testifyhub/prod/origin/verify-secret). It is never stored
 * in this repository, and never hardcoded.
 */

const HEADER = 'x-origin-verify';

/**
 * Paths that must answer without the header.
 *
 * The health endpoint is probed from ON the instance — by the systemd
 * watchdog every 30 seconds, by the deploy script's health gate, and by the
 * container HEALTHCHECK. None of those go through CloudFront, so none carry
 * the header.
 *
 * Exempting by PATH rather than by source address is deliberate. The container
 * sits behind a Docker port mapping (host :80 -> container :8080), so a probe
 * to localhost on the host arrives inside the container from the Docker bridge
 * gateway (typically 172.17.0.1) — NOT from 127.0.0.1. A loopback check would
 * therefore never match, the watchdog would get 403s, and it would restart a
 * perfectly healthy container roughly every 90 seconds.
 *
 * Exposing the health endpoint without the header is harmless: it returns only
 * a liveness result and no data.
 */
const DEFAULT_EXEMPT_PATHS = ['/api/v1/healthcheck/ping'];

const exemptPaths = (): string[] => {
  const configured = process.env.ORIGIN_VERIFY_EXEMPT_PATHS;
  if (!configured) return DEFAULT_EXEMPT_PATHS;
  return configured
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
};

/** Constant-time compare, so the value cannot be discovered by timing. */
const matches = (provided: string, expected: string): boolean => {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  // timingSafeEqual throws on length mismatch, which would itself leak length.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
};

export const OriginVerifyMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const expected = process.env.ORIGIN_VERIFY_SECRET;

  // Not configured: local development, tests, and anything not behind
  // CloudFront. Enforcing here would break every one of them.
  if (!expected) return next();

  if (exemptPaths().includes(req.path)) return next();

  const provided = req.headers[HEADER];
  if (typeof provided === 'string' && matches(provided, expected)) {
    return next();
  }

  ApiResponse.error(res, new Error('Forbidden'), StatusCodes.FORBIDDEN);
};

export default OriginVerifyMiddleware;
