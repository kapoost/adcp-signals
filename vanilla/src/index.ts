import { startSignalsAgent } from '@signals/core';
import { z } from 'zod';
import { CATALOG } from './catalog.ts';

const env = z
  .object({
    PORT: z.coerce.number().int().positive().default(3010),
    ADCP_AUTH_TOKEN: z.string().min(8),
    PUBLIC_BASE_URL: z.string().url().default('http://127.0.0.1:3010'),
  })
  .parse(process.env);

startSignalsAgent({
  name: 'signals-vanilla',
  version: '0.0.1',
  port: env.PORT,
  publicBaseUrl: env.PUBLIC_BASE_URL,
  authToken: env.ADCP_AUTH_TOKEN,
  dataProvider: {
    name: 'Vanilla Reference',
    domain: 'vanilla.adcp.example',
    internal_platform: 'vanilla_internal',
  },
  catalog: CATALOG,
});
