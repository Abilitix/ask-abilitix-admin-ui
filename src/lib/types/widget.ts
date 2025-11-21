export interface WidgetConfig {
  enabled: boolean;
  tenant_slug: string;
  widget_key: string; // Full key (for clipboard, not display)
  widget_key_masked: string; // Masked key (for UI display)
  primary_color: string;
  accent_color: string;
  title: string;
  welcome_message: string;
  position: string;
  allowed_domains: string[];
  embed_snippet: string;
  usage?: {
    last_used_at?: string;
    last_used_from?: string;
    total_requests?: number;
  };
}

export interface RotateKeyResponse {
  ok: boolean;
  widget_key: string; // New full key (for embed snippet)
  embed_snippet: string; // New embed snippet with new key
}

