export type WdcConfig = {
  version?: string;
  id?: string;
  name?: string;
  subtitle?: string;
  description?: string;
  changeLog?: string;
  githubRepo?: string;
  curationListUrl?: string;
  curationListId?: string;
  curationListVersionBranch?: string;
  tags?: string[];
};

export default function defineConfig(config: WdcConfig): WdcConfig {
  return config;
}
