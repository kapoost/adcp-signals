export interface SignalDefinition {
  id: string;
  name: string;
  description: string;
  signal_type: 'owned' | 'marketplace' | 'custom';
  coverage_percentage: number;
  cpm?: number;
  currency?: string;
}

export interface DataProvider {
  name: string;
  domain: string;
  internal_platform: string;
}

export interface SignalsAgentConfig {
  name: string;
  version: string;
  port: number;
  publicBaseUrl: string;
  authToken: string;
  dataProvider: DataProvider;
  catalog: readonly SignalDefinition[];
}

export interface SignalsAccountMeta {
  network_code: string;
}
