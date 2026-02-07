// experiment types - all lowercase text in ui
export interface Experiment {
  _id: string;
  name: string;
  description: string;
  userId: string;
  status: "active" | "archived" | "completed";
  defaultBranch: string;
  createdAt: string;
  updatedAt: string;
  runCount?: number;
  branches?: ExperimentBranch[];
}

export interface VersionInfo {
  version: string;
  parentRunId?: string;
  branchName: string;
  commitMessage: string;
  isLatest: boolean;
}

export interface ExperimentRun {
  _id: string;
  experimentId: string;
  userId: string;
  runNumber: number;
  name: string;
  status: "running" | "completed" | "failed" | "cancelled";
  parameters: Record<string, any>;
  metrics: Record<string, any>;
  versionInfo: VersionInfo;
  tags: string[];
  startTime: string;
  endTime?: string;
  duration?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExperimentBranch {
  _id: string;
  experimentId: string;
  name: string;
  parentBranch?: string;
  createdFromRunId?: string;
  userId: string;
  description: string;
  createdAt: string;
  runCount?: number;
}

export interface RunComparison {
  runs: {
    _id: string;
    runNumber: number;
    name: string;
    status: string;
    version: string;
    branchName: string;
    startTime: string;
    endTime?: string;
    duration?: number;
    tags: string[];
  }[];
  parameters: {
    keys: string[];
    values: {
      runId: string;
      runNumber: number;
      values: Record<string, any>;
    }[];
  };
  metrics: {
    keys: string[];
    values: {
      runId: string;
      runNumber: number;
      values: Record<string, any>;
    }[];
  };
  statistics: Record<string, {
    min: number;
    max: number;
    avg: number;
    bestRunId: string;
  }>;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// filter types
export interface RunFilters {
  branch?: string;
  status?: string;
  tags?: string[];
  dateRange?: { start: string; end: string };
}

// form types
export interface ExperimentFormData {
  name: string;
  description: string;
}

export interface RunFormData {
  name: string;
  parameters: Record<string, any>;
  metrics: Record<string, any>;
  branchName: string;
  commitMessage: string;
  tags: string[];
}

// chart data types
export interface MetricChartData {
  runNumber: number;
  runName: string;
  [key: string]: number | string;
}

export interface ParameterChartData {
  name: string;
  value: number;
  runNumber: number;
}
