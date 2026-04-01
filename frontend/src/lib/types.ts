export type LLMProvider = "groq" | "anthropic";

export interface LLMSettings {
  provider: LLMProvider;
  apiKey: string; // empty = use server default
}

export type StepName = "planning" | "searching" | "reading" | "analyzing" | "writing";

export interface StepStartEvent {
  type: "step_start";
  step: StepName;
  message: string;
  index?: number;
  url?: string;
}

export interface StepDataEvent {
  type: "step_data";
  step: StepName;
  data: Record<string, unknown>;
}

export interface ChunkEvent {
  type: "chunk";
  content: string;
}

export interface DoneEvent {
  type: "done";
  data: {
    report: string;
    sources: Source[];
    session_id: string;
  };
}

export interface ErrorEvent {
  type: "error";
  content: string;
}

export type SSEEvent = StepStartEvent | StepDataEvent | ChunkEvent | DoneEvent | ErrorEvent;

export interface Source {
  title: string;
  url: string;
  content?: string;
}

export interface AgentStep {
  step: StepName;
  message: string;
  status: "active" | "done";
  data?: Record<string, unknown>;
  startTime: number;
  endTime?: number;
  children?: AgentStep[];
}
