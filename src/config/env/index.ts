import production from './production';
import development from './development';
import staging from './staging';
import test from './test';
import { JwtSignature } from '../../shared/interface';

export const JwtSignOptions: JwtSignature = {
  issuer: 'Testify',
  subject: 'Authentication Token',
  audience: 'https://testify.com',
};

export default {
  production,
  development,
  staging,
  test,
}[process.env.TESTIFY_NODE_ENV ?? 'development'];
