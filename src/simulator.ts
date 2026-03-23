import path from 'path';
import fs from 'fs';
import { buildNotification, EventInput } from './payloads';
import { sendToTarget } from './sender';

export type SimulateMode = 'random' | 'sequential' | 'burst';

export interface Scenario {
  analyticEventName: string;
  cameraId: string;
  weight?: number;
  description?: string;
}

export interface SimulatorStatus {
  running: boolean;
  mode: SimulateMode | null;
  intervalMs: number | null;
  sent: number;
  errors: number;
  scenariosLoaded: number;
  scenariosFile: string;
}

class Simulator {
  private timer: ReturnType<typeof setInterval> | null = null;
  private scenarios: Scenario[] = [];
  private sequentialIndex = 0;
  private sent = 0;
  private errors = 0;
  private mode: SimulateMode | null = null;
  private intervalMs: number | null = null;
  private scenariosFile: string;

  constructor() {
    this.scenariosFile = path.resolve(process.cwd(), 'scenarios.json');
  }

  loadScenarios(filePath?: string): void {
    const target = filePath ?? this.scenariosFile;
    if (!fs.existsSync(target)) {
      throw new Error(`Scenarios file not found: ${target}`);
    }
    const raw = fs.readFileSync(target, 'utf-8');
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('scenarios.json must be a non-empty array');
    }
    this.scenarios = parsed as Scenario[];
    this.scenariosFile = target;
    this.sequentialIndex = 0;
  }

  start(mode: SimulateMode, intervalMs: number, scenariosFile?: string): void {
    if (this.timer) {
      throw new Error('Simulator is already running. Call /simulate/stop first.');
    }
    this.loadScenarios(scenariosFile);
    this.mode = mode;
    this.intervalMs = intervalMs;
    this.sent = 0;
    this.errors = 0;
    this.sequentialIndex = 0;

    this.timer = setInterval(() => {
      this.tick().catch((err: Error) => console.error('[simulator] tick error:', err.message));
    }, intervalMs);

    console.log(`[simulator] started — mode=${mode} interval=${intervalMs}ms scenarios=${this.scenarios.length}`);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.mode = null;
    this.intervalMs = null;
    console.log(`[simulator] stopped — sent=${this.sent} errors=${this.errors}`);
  }

  status(): SimulatorStatus {
    return {
      running: this.timer !== null,
      mode: this.mode,
      intervalMs: this.intervalMs,
      sent: this.sent,
      errors: this.errors,
      scenariosLoaded: this.scenarios.length,
      scenariosFile: this.scenariosFile,
    };
  }

  private async tick(): Promise<void> {
    if (this.scenarios.length === 0) return;

    if (this.mode === 'burst') {
      await this.sendBurst();
    } else if (this.mode === 'sequential') {
      await this.sendSequential();
    } else {
      await this.sendRandom();
    }
  }

  private async sendRandom(): Promise<void> {
    const scenario = this.pickWeightedRandom();
    await this.dispatch([scenario]);
  }

  private async sendSequential(): Promise<void> {
    const scenario = this.scenarios[this.sequentialIndex % this.scenarios.length];
    this.sequentialIndex++;
    await this.dispatch([scenario]);
  }

  private async sendBurst(): Promise<void> {
    await this.dispatch(this.scenarios);
  }

  private async dispatch(events: Scenario[]): Promise<void> {
    const inputs: EventInput[] = events.map((s) => ({
      analyticEventName: s.analyticEventName,
      cameraId: s.cameraId,
    }));
    const payload = buildNotification(inputs);
    const result = await sendToTarget(payload);

    if (result.success) {
      this.sent += events.length;
    } else {
      this.errors += events.length;
      console.error(
        `[simulator] target returned ${result.targetResponse.status}:`,
        result.targetResponse.data
      );
    }
  }

  private pickWeightedRandom(): Scenario {
    const totalWeight = this.scenarios.reduce((sum, s) => sum + (s.weight ?? 1), 0);
    let rand = Math.random() * totalWeight;
    for (const s of this.scenarios) {
      rand -= s.weight ?? 1;
      if (rand <= 0) return s;
    }
    return this.scenarios[this.scenarios.length - 1];
  }
}

// Singleton shared across the app
export const simulator = new Simulator();
