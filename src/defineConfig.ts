type WdcConfig = {
  name?: string;
  description?: string;
  curationListUrl?: string;
};

export default function defineConfig(config: WdcConfig): WdcConfig {
  return config;
}
