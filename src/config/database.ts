import pgp from 'pg-promise';
import promise from 'bluebird';
import Env from '../shared/utils/env';

const pg = pgp({ promiseLib: promise, noWarnings: true });

/**
 * Connection pool bounds are set explicitly rather than left to the driver
 * default, because the ceiling is not ours to guess at.
 *
 * RDS `db.t4g.micro` allows on the order of 80-110 concurrent connections,
 * derived from instance memory. Exhausting that does not fail gracefully: new
 * connections are refused outright and the symptom looks like a total database
 * outage rather than a saturated pool. Design doc §8.4 calls this out as a
 * launch risk, since a burst of sign-ups is exactly the moment it would happen.
 *
 * 10 is deliberately conservative. One instance runs today and the ASG is
 * fixed at one, so this consumes roughly a tenth of the available connections
 * and leaves ample headroom for migrations, a psql session during an incident,
 * and a second instance at Stage 2 — without anyone having to recalculate.
 *
 * Raise with DB_POOL_MAX if a real bottleneck is measured. Do not raise it
 * speculatively: a larger pool moves the failure from "requests queue" to
 * "database refuses everything", which is strictly worse.
 */
const POOL_MAX = Number(process.env.DB_POOL_MAX ?? 10);

/**
 * How long an idle connection is kept before being returned. RDS closes idle
 * connections on its own schedule; releasing first avoids handing the
 * application a socket the server has already discarded.
 */
const IDLE_TIMEOUT_MS = Number(process.env.DB_IDLE_TIMEOUT_MS ?? 30_000);

/**
 * Cap on waiting for a connection. Without it a request can wait indefinitely
 * while the pool is saturated, tying up the event loop and turning a slow
 * database into an unresponsive API.
 */
const CONNECT_TIMEOUT_MS = Number(process.env.DB_CONNECT_TIMEOUT_MS ?? 10_000);

/**
 * `connectionString` is kept as-is rather than split into host/user/password
 * fields. The deploy script assembles it from Parameter Store and appends
 * `?sslmode=verify-full&sslrootcert=...`; RDS PostgreSQL 17 sets
 * rds.force_ssl = 1 and refuses unencrypted connections. Rebuilding the URL
 * from parts would drop those parameters and every connection would fail with
 * a misleading "no pg_hba.conf entry ... no encryption".
 */
const db = pg({
  connectionString: Env.get<string>('DATABASE_URL'),
  max: POOL_MAX,
  idleTimeoutMillis: IDLE_TIMEOUT_MS,
  connectionTimeoutMillis: CONNECT_TIMEOUT_MS,
});

export { db };
