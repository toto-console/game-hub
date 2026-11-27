import {consoleMotion} from './console-motion';
import {motionAllowed} from '../focus-motion';
import {createScrollAxis} from './scroll-engine';
export function scrollAxis(axis:'x'|'y'){
 return createScrollAxis(axis,consoleMotion.scrollRate[axis],motionAllowed);
}
