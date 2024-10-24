import ical from 'ical';
import { parseDesc } from './parseDescription.mjs';
import path from 'path';

/**
 * parse an ics file into an event, including information parsed from the description
 *
 * the returned events
 *
 * @param {string} fn an .ics filename
 * @returns an array of events
 */
function getEventsFromFile(fn, props) {
  return Object.values(ical.parseFile(fn))
    .filter(event => event.type === 'VEVENT')
    .map(event => {
      return {
        start: event.start,
        end: event.end,
        id: event.uid,
        description: event.description?.val,
        //extendedProps: {
        ...parseDesc(event.description?.val),
        location: event.location?.val,
        ...props
        //}
      }
    });
}
function parseEvents(fileNames, propname = undefined) {
  return fileNames.map(fn => {
    let props = {}
    if (propname) props[propname] = path.basename(fn, '.ics')
    return getEventsFromFile(fn, props)
  }).flat();
}

export default parseEvents;
