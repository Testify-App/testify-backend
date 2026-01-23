import production from './production';
import staging from './staging';
import development from './development';
import test from './test';
import { JwtSignature } from '../../shared/interfaces';

export const JwtSignOptions: JwtSignature = {
  issuer: 'Template',
  subject: 'Authentication Token',
  audience: 'https://template.com',
};

export default {
  production,
  staging,
  development,
  test,
}[process.env.TESTIFY_NODE_ENV || 'development'];
