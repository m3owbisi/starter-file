// event types for cross-component communication
export type EventType =
  | "dataset:uploaded"
  | "dataset:validating"
  | "dataset:validated"
  | "dataset:validation_failed"
  | "prediction:queued"
  | "prediction:started"
  | "prediction:progress"
  | "prediction:completed"
  | "prediction:failed"
  | "visualization:ready"
  | "visualization:updated"
  | "experiment:created"
  | "experiment:run_started"
  | "experiment:run_completed"
  | "analytics:updated";

// event payload types
export interface DatasetUploadedPayload {
  datasetId: string;
  filename: string;
  fileType: string;
  userId: string;
}

export interface DatasetValidatedPayload {
  datasetId: string;
  isValid: boolean;
  validationLogs: Array<{
    level: string;
    message: string;
  }>;
}

export interface PredictionStartedPayload {
  predictionId: string;
  datasetId?: string;
  userId: string;
}

export interface PredictionProgressPayload {
  predictionId: string;
  progress: number;
  stage: string;
}

export interface PredictionCompletedPayload {
  predictionId: string;
  datasetId?: string;
  experimentId?: string;
  bindingSitesCount: number;
  overallScore: number;
  confidenceScore: number;
}

export interface VisualizationReadyPayload {
  datasetId?: string;
  predictionId?: string;
  bindingSites?: Array<{
    residueId: string;
    chainId: string;
    score: number;
  }>;
}

export interface ExperimentCreatedPayload {
  experimentId: string;
  name: string;
  userId: string;
}

export interface AnalyticsUpdatedPayload {
  type: "upload" | "prediction" | "experiment";
  timestamp: string;
}

// payload type mapping
export interface EventPayloadMap {
  "dataset:uploaded": DatasetUploadedPayload;
  "dataset:validating": { datasetId: string };
  "dataset:validated": DatasetValidatedPayload;
  "dataset:validation_failed": DatasetValidatedPayload;
  "prediction:queued": PredictionStartedPayload;
  "prediction:started": PredictionStartedPayload;
  "prediction:progress": PredictionProgressPayload;
  "prediction:completed": PredictionCompletedPayload;
  "prediction:failed": { predictionId: string; error: string };
  "visualization:ready": VisualizationReadyPayload;
  "visualization:updated": VisualizationReadyPayload;
  "experiment:created": ExperimentCreatedPayload;
  "experiment:run_started": { experimentId: string; runId: string };
  "experiment:run_completed": { experimentId: string; runId: string };
  "analytics:updated": AnalyticsUpdatedPayload;
}

// event handler type
export type EventHandler<T extends EventType> = (
  payload: EventPayloadMap[T]
) => void | Promise<void>;

// event bus class - singleton for cross-component communication
class EventBus {
  private handlers: Map<EventType, Set<EventHandler<any>>> = new Map();
  private static instance: EventBus;

  private constructor() {}

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  // subscribe to an event
  on<T extends EventType>(event: T, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);

    // return unsubscribe function
    return () => {
      this.handlers.get(event)?.delete(handler);
    };
  }

  // unsubscribe from an event
  off<T extends EventType>(event: T, handler: EventHandler<T>): void {
    this.handlers.get(event)?.delete(handler);
  }

  // emit an event
  emit<T extends EventType>(event: T, payload: EventPayloadMap[T]): void {
    const eventHandlers = this.handlers.get(event);
    if (eventHandlers) {
      eventHandlers.forEach((handler) => {
        try {
          handler(payload);
        } catch (error) {
          console.error(`error in event handler for ${event}:`, error);
        }
      });
    }
  }

  // emit async event and wait for all handlers
  async emitAsync<T extends EventType>(
    event: T,
    payload: EventPayloadMap[T]
  ): Promise<void> {
    const eventHandlers = this.handlers.get(event);
    if (eventHandlers) {
      const promises = Array.from(eventHandlers).map(async (handler) => {
        try {
          await handler(payload);
        } catch (error) {
          console.error(`error in async event handler for ${event}:`, error);
        }
      });
      await Promise.all(promises);
    }
  }

  // clear all handlers for an event
  clear(event?: EventType): void {
    if (event) {
      this.handlers.delete(event);
    } else {
      this.handlers.clear();
    }
  }
}

// export singleton instance
export const eventBus = EventBus.getInstance();

// convenience functions
export const on = <T extends EventType>(
  event: T,
  handler: EventHandler<T>
): (() => void) => eventBus.on(event, handler);

export const emit = <T extends EventType>(
  event: T,
  payload: EventPayloadMap[T]
): void => eventBus.emit(event, payload);

export const emitAsync = <T extends EventType>(
  event: T,
  payload: EventPayloadMap[T]
): Promise<void> => eventBus.emitAsync(event, payload);
