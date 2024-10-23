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
function getEventsFromFile(fn) {
  return Object.values(ical.parseFile(fn))
    .filter(event => event.type === 'VEVENT')
    .map(event => {
      return {
        start: event.start,
        end: event.end,
        id: event.uid,
        description: event.description?.val,
        ...parseDesc(event.description?.val),
        location: event.location?.val,
      }
    });
}


function parseFilename(fn) {
  const basename = path.basename(fn, '.ics')

  const pos = basename.indexOf(' ')

  if (pos > 0) {
    const code = basename.substring(0, pos)
    const name = basename.substring(pos + 1)
    return [code, name ?? code]
  } else {
    return [basename, basename]
  }
}

function parseCours(fileNames) {
  return fileNames.map(fn => {
    const [code, name] = parseFilename(fn)

    return getEventsFromFile(fn).map(event => ({ ...event, cours: [{ code, name: code === name ? code : `${code} - ${name}` }] }))
  }).flat();
}

export default parseCours;
