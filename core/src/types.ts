export type SignalSubjectType = 'individual' | 'household' | 'business' | 'contextual' | 'none';

export type SignalResolutionMethod =
  | 'deterministic_id'
  | 'probabilistic_device'
  | 'browser'
  | 'geographic'
  | 'content_signal'
  | 'mixed';

export interface SignalDefinition {
  id: string;
  name: string;
  description: string;
  signal_type: 'owned' | 'marketplace' | 'custom';
  coverage_percentage: number;
  cpm?: number;
  currency?: string;
  subject_type?: SignalSubjectType;
  resolution_method?: SignalResolutionMethod;
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
