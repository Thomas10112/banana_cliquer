import { RefObject } from 'react';

export type TutorialKey =
  | 'banana'
  | 'statsBar'
  | 'upgradesTab'
  | 'firstUpgrade'
  | 'upgradesPanel'
  | 'questsTab'
  | 'questsPanel'
  | 'migrationBtn'
  | 'mapArea'
  | 'mapPanelBtn'
  | 'firstPoi';

export type TutorialEvent = 'upgradesTabOpened' | 'questsTabOpened';

export interface ElementRect { x: number; y: number; width: number; height: number }

const refs: Partial<Record<TutorialKey, RefObject<any>>> = {};
let _bananaLocked = false;
export function setBananaLocked(v: boolean) { _bananaLocked = v; }
export function isBananaLocked(): boolean    { return _bananaLocked; }
const eventCallbacks: Partial<Record<TutorialEvent, () => void>> = {};

export function registerTutorialRef(key: TutorialKey, ref: RefObject<any>) {
  refs[key] = ref;
}

export function onTutorialEvent(event: TutorialEvent, callback: () => void) {
  eventCallbacks[event] = callback;
}

export function offTutorialEvent(event: TutorialEvent) {
  delete eventCallbacks[event];
}

export function fireTutorialEvent(event: TutorialEvent) {
  eventCallbacks[event]?.();
}

export function measureTutorialElement(key: TutorialKey, padding = 10): Promise<ElementRect | null> {
  return new Promise(resolve => {
    const ref = refs[key];
    if (!ref?.current) { resolve(null); return; }
    ref.current.measureInWindow((x: number, y: number, width: number, height: number) => {
      resolve({
        x:      x - padding,
        y:      y - padding,
        width:  width  + padding * 2,
        height: height + padding * 2,
      });
    });
  });
}
