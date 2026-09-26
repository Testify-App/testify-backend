-- PostgreSQL cannot remove a value from an enum. Reversing this would mean
-- recreating the type and rewriting every column that uses it, which risks far
-- more than leaving an unused label in place. Deliberately a no-op.
SELECT 1;
