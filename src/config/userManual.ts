/** Hash route for in-app user manual (static HTML under `public/manual/`). */
export const USER_MANUAL_ROUTE = '/user-manual';

export const MANUAL_BASE_PATH = `${process.env.PUBLIC_URL || ''}/manual`;

export interface ManualChapter {
  label: string;
  file: string;
}

export const MANUAL_CHAPTERS: ManualChapter[] = [
  { label: 'Overview', file: 'index.html' },
  { label: 'Video Tutorial', file: 'tutorial.html' },
  { label: 'Set Your Stimuli Pool', file: 'stimuli.html' },
  { label: 'Priming', file: 'priming.html' },
  { label: 'Design Your Trial Flow', file: 'trial.html' },
  { label: 'Preview Your Trial', file: 'preview.html' },
  { label: 'Embed into Qualtrics', file: 'qualtrics.html' },
  { label: 'Analyze Your Data', file: 'analyze.html' },
  { label: 'Load/Save Your Design', file: 'load.html' },
];
