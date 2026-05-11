import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

const truthy = (value: unknown): boolean =>
  value === true || value === 'true' || value === '1';

export const getDatabaseConfig = (config: ConfigService): TypeOrmModuleOptions => {
  const env = config.get<string>('NODE_ENV');
  const isProd = env === 'production';

  // `synchronize` auto-creates the schema from entities — fine for dev and
  // first-time staging boot, never for prod with real data. Override via
  // `DB_SYNCHRONIZE=true` to opt-in explicitly (e.g. initial staging deploy
  // before migrations exist).
  const synchronize = truthy(config.get('DB_SYNCHRONIZE')) || !isProd;

  // Neon and most managed Postgres require SSL. Detect via host or explicit
  // `DB_SSL=true`. Local docker (host=postgres / localhost) stays plain TCP.
  const host = config.get<string>('DB_HOST', 'localhost');
  const explicitSsl = truthy(config.get('DB_SSL'));
  const looksManaged = /neon\.tech|render\.com|amazonaws\.com|supabase\.co|aiven\.io/i.test(host);
  const useSsl = explicitSsl || looksManaged;

  return {
    type: 'postgres',
    host,
    port: config.get<number>('DB_PORT', 5432),
    username: config.get('DB_USERNAME', 'feeling_user'),
    password: config.get('DB_PASSWORD', 'feeling_password'),
    database: config.get('DB_NAME', 'feeling_beauty'),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize,
    logging: env === 'development',
    ssl: useSsl ? { rejectUnauthorized: false } : false,
  };
};
