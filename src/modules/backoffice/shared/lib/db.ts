import { ITask } from 'pg-promise';

/** The database or an open transaction: shared helpers accept either. */
export type Queryable = Pick<ITask<any>, 'none' | 'one' | 'oneOrNone' | 'many' | 'manyOrNone' | 'any'>;
