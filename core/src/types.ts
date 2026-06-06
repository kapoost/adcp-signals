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
  /** ISO 8601 timestamp of when this definition record was last updated.
   * Freshness of the record, not the underlying data/model. (adcp #5249) */
  last_updated?: string;
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
