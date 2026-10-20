import raw from './demo.json';
import type { DemoMeta, Result } from '../types';

export const demoData = raw as unknown as { meta: DemoMeta; results: Result[] };
export const demoMeta: DemoMeta = demoData.meta;
export const demoResults: Result[] = demoData.results;
