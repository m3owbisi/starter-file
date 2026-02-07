import { eventBus, emit } from "../events/eventBus";

// workflow state types
export type WorkflowStage =
  | "idle"
  | "uploading"
  | "validating"
  | "predicting"
  | "visualizing"
  | "completed"
  | "error";

export interface WorkflowState {
  stage: WorkflowStage;
  progress: number;
  datasetId?: string;
  predictionId?: string;
  experimentId?: string;
  error?: string;
  startTime?: number;
}

export interface WorkflowOptions {
  autoPredict?: boolean;
  autoVisualize?: boolean;
  autoCreateExperiment?: boolean;
  experimentName?: string;
}

// workflow orchestrator class
class WorkflowOrchestrator {
  private static instance: WorkflowOrchestrator;
  private currentState: WorkflowState = { stage: "idle", progress: 0 };
  private stateListeners: Set<(state: WorkflowState) => void> = new Set();

  private constructor() {
    this.setupEventListeners();
  }

  static getInstance(): WorkflowOrchestrator {
    if (!WorkflowOrchestrator.instance) {
      WorkflowOrchestrator.instance = new WorkflowOrchestrator();
    }
    return WorkflowOrchestrator.instance;
  }

  // setup event listeners for automatic workflow progression
  private setupEventListeners(): void {
    // when dataset is uploaded, start validation
    eventBus.on("dataset:uploaded", async (payload) => {
      this.updateState({
        stage: "validating",
        progress: 25,
        datasetId: payload.datasetId,
        startTime: Date.now(),
      });
    });

    // when validation completes, optionally start prediction
    eventBus.on("dataset:validated", async (payload) => {
      if (payload.isValid) {
        this.updateState({
          ...this.currentState,
          stage: "predicting",
          progress: 50,
        });
      } else {
        this.updateState({
          ...this.currentState,
          stage: "error",
          error: "dataset validation failed",
        });
      }
    });

    // when prediction completes, move to visualization
    eventBus.on("prediction:completed", async (payload) => {
      this.updateState({
        ...this.currentState,
        stage: "visualizing",
        progress: 75,
        predictionId: payload.predictionId,
      });
    });

    // when visualization is ready, workflow is complete
    eventBus.on("visualization:ready", async () => {
      this.updateState({
        ...this.currentState,
        stage: "completed",
        progress: 100,
      });
    });

    // handle failures
    eventBus.on("prediction:failed", async (payload) => {
      this.updateState({
        ...this.currentState,
        stage: "error",
        error: payload.error,
      });
    });
  }

  // update workflow state and notify listeners
  private updateState(newState: WorkflowState): void {
    this.currentState = newState;
    this.stateListeners.forEach((listener) => {
      try {
        listener(newState);
      } catch (error) {
        console.error("error in workflow state listener:", error);
      }
    });
  }

  // subscribe to state changes
  onStateChange(listener: (state: WorkflowState) => void): () => void {
    this.stateListeners.add(listener);
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  // get current state
  getState(): WorkflowState {
    return { ...this.currentState };
  }

  // start a new workflow
  async startWorkflow(options: WorkflowOptions = {}): Promise<void> {
    this.updateState({
      stage: "uploading",
      progress: 0,
      startTime: Date.now(),
    });
  }

  // trigger dataset validation
  async triggerValidation(datasetId: string): Promise<void> {
    try {
      this.updateState({
        stage: "validating",
        progress: 25,
        datasetId,
      });

      emit("dataset:validating", { datasetId });

      const response = await fetch(`/api/datasets/${datasetId}/validate`, {
        method: "POST",
      });

      const result = await response.json();

      if (result.success && result.isValid) {
        emit("dataset:validated", {
          datasetId,
          isValid: true,
          validationLogs: result.logs || [],
        });
      } else {
        emit("dataset:validation_failed", {
          datasetId,
          isValid: false,
          validationLogs: result.logs || [{ level: "error", message: result.error || "validation failed" }],
        });
      }
    } catch (error) {
      console.error("validation error:", error);
      emit("dataset:validation_failed", {
        datasetId,
        isValid: false,
        validationLogs: [{ level: "error", message: "validation request failed" }],
      });
    }
  }

  // trigger prediction for a dataset
  async triggerPrediction(
    datasetId: string,
    options: { sequence?: string; ligandSmiles?: string } = {}
  ): Promise<string | null> {
    try {
      this.updateState({
        ...this.currentState,
        stage: "predicting",
        progress: 50,
        datasetId,
      });

      const response = await fetch(`/api/datasets/${datasetId}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options),
      });

      const result = await response.json();

      if (result.success) {
        emit("prediction:started", {
          predictionId: result.predictionId,
          datasetId,
          userId: result.userId,
        });
        return result.predictionId;
      } else {
        emit("prediction:failed", {
          predictionId: "",
          error: result.error || "prediction failed",
        });
        return null;
      }
    } catch (error) {
      console.error("prediction error:", error);
      emit("prediction:failed", {
        predictionId: "",
        error: "prediction request failed",
      });
      return null;
    }
  }

  // create experiment from workflow
  async createExperiment(
    name: string,
    datasetId?: string,
    predictionId?: string
  ): Promise<string | null> {
    try {
      const response = await fetch("/api/experiments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.toLowerCase(),
          description: `auto-created experiment from workflow`,
          datasetId,
          predictionId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        this.updateState({
          ...this.currentState,
          experimentId: result.data._id,
        });

        emit("experiment:created", {
          experimentId: result.data._id,
          name: result.data.name,
          userId: result.data.userId,
        });

        return result.data._id;
      }
      return null;
    } catch (error) {
      console.error("experiment creation error:", error);
      return null;
    }
  }

  // reset workflow
  reset(): void {
    this.updateState({
      stage: "idle",
      progress: 0,
    });
  }
}

// export singleton instance
export const workflowOrchestrator = WorkflowOrchestrator.getInstance();

// convenience hook for react components
export const getWorkflowState = (): WorkflowState =>
  workflowOrchestrator.getState();

export const subscribeToWorkflow = (
  listener: (state: WorkflowState) => void
): (() => void) => workflowOrchestrator.onStateChange(listener);
