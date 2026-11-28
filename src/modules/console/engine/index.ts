// Loads the console engine in the design's order. Later modules wrap builders from earlier ones.
import './data';
import './engine';
import './views';
import './order';
import './pages';
import './drawers';
import './cats';
import './roles';
import './media';
import './crud';
import './v5';
import './v6';
import './liveBridge';
import './catalogueLots';

export { MBA, MBV } from './registry';
