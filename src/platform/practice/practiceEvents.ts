export const PRACTICE_TIMER_SELECT_EVENT = 'aprendo:practice-timer-select';
export const PRACTICE_TOOLS_OPEN_EVENT = 'aprendo:practice-tools-open';
export const METRONOME_COMMAND_EVENT = 'aprendo:metronome-command';
export const METRONOME_STATE_EVENT = 'aprendo:metronome-state';

export interface PracticeTimerSelection {
  key: string;
  label: string;
  badgeLabel: string;
  seconds: number;
}

export interface MetronomeCommand {
  action: 'start' | 'stop';
  source?: string;
}

export interface MetronomeState {
  playing: boolean;
}
