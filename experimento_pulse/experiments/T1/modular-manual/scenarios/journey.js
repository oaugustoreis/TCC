import { baseUrl } from '../config/environment.js';
import { scenarios, thresholds } from '../profiles/smoke.js';
import { journey } from '../flows/journey.js';
export const options = { scenarios, thresholds };
export default function () { journey(baseUrl); }
