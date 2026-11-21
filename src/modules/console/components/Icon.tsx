import type { ReactElement } from 'react';
import { MBV } from '../engine';
import type { ConsoleIconName } from '../../../constants/nav';

/** Stroke icons from the console design, drawn on a 24×24 grid in the current text colour. */
export function Icon({ name, size = 17 }: { name: ConsoleIconName; size?: number }): ReactElement {
  return MBV.svg(name, size);
}
