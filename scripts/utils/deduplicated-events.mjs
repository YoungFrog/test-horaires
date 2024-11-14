import { readFileSync } from 'fs';

/**
 * @typedef {{code: string, name?: string}} Resource
 * @typedef {{cours?: Resource[], salles?: Resource[], profs?: Resource[], groupes?: Resource[], start: string, end: string, id: string, description: string}} HoraireEvent
 * @typedef {{cours?: string[], salles?: string[], profs?: string[], groupes?: string[], start: string, end: string, id: string }} InternalEvent - we remove some things to simplify the diff
 */

const EVENT_PROPERTIES = ["cours", "salles", "profs", "groupes"];


function getAndFilterEventsFromFile(fn) {
    /** @type {HoraireEvent[]} */
    const array = JSON.parse(readFileSync(fn));
    array.forEach(event => {
        delete event['description'];
        for (let prop of EVENT_PROPERTIES)
            if (event[prop]) event[prop] = event[prop].map(r => r.code);
    });

    const nb_of_ids = new Set(array.map(e => e.id)).size;
    if (array.length !== nb_of_ids) {
        throw Error(`events with duplicate ids found in ${fn} (${array.length} elements but ${nb_of_ids} ids)`);
    }

    return array;
}

/**
 * 
 * @param {any[]} xs
 * @param {any[]} ys
 * @returns true if xs and ys are equal as sets
 */
function areEqualsAsSets(xs, ys) {
    if (xs === ys) return true
    if (!xs || !ys) return false
    return xs.length === ys.length && xs.every(x => ys.includes(x));
}

/**
 * 
 * @param {HoraireEvent} evt 
 * @param {HoraireEvent} otherEvent 
 * @returns {number}
 */
function differences(evt, otherEvent) {
    let cnt = 0
    for (let prop of EVENT_PROPERTIES)
        if (!areEqualsAsSets(otherEvent[prop], evt[prop])) cnt++

    if (otherEvent.start !== evt.start || otherEvent.end !== evt.end) cnt++
    return cnt
}

/**
 *
 * @param {HoraireEvent} evt 
 * @param {HoraireEvent[]} events 
 * @returns {HoraireEvent[]}
 */
function identicals(evt, events) {
    return events.filter(otherEvent => differences(evt, otherEvent) <= 0)
}

/**
 *
 * @param {HoraireEvent} evt 
 * @param {HoraireEvent[]} events 
 * @returns {HoraireEvent[]}
 */
function similars(evt, events) {
    return events.filter(otherEvent => differences(evt, otherEvent) <= 1)
}

/**
 * 
 * @param {Array<HoraireEvent>} from 
 * @param {Array<HoraireEvent>} to 
 */
function separateEvents(from, to) {
    const fromIds = new Set(from.map(e => e.id))
    const toIds = new Set(to.map(e => e.id))
    const intersectionIds = fromIds.intersection(toIds)
    const isNotInIntersection = e => !intersectionIds.has(e.id)
    const removed = from.filter(isNotInIntersection)
    const added = to.filter(isNotInIntersection)
    // const { true: intersection, false: added } = Object.groupBy(to, isInIntersection)
    // const { false: removed } = Object.groupBy(from, isInIntersection)

    return [removed, added]
}

/**
 * Find events in `to` that match an event in `from` and ensure their `id` is the same.
 * 
 * An events in to will be matched with an event in from if they
 * 1. already have the same id, or
 * 2. all other properties are identical, or
 * 3. all but one other properties are identical
 * 
 * The properties are those in EVENT_PROPERTIES and start+end
 * (start+end counts as /one/ property for the purpose of counting)
 * 
 * @param {HoraireEvent[]} from events "before"
 * @param {HoraireEvent[]} to events "after"
 */

function reconcileEvents(from, to) {
    const [removed, added] = separateEvents(from, to); // don't consider events with the same id
    const remaining = []

    // first match "added" and "removed" events that are 100% identical
    added.forEach(evt => {
        const identicalEvents = identicals(evt, removed);
        if (!identicalEvents.length) {
            remaining.push(evt)
            return
        }

        if (identicalEvents.length > 1) throw Error("multiple events seem identicals" + JSON.stringify({ evt, identicalEvents }));
        const otherEvent = identicalEvents.at(0);
        removed.splice(removed.indexOf(otherEvent), 1);
        evt.id = otherEvent.id;
    });

    // then match "added" and "removed" events that are similar
    remaining.forEach(evt => {
        const similarEvents = similars(evt, removed);
        if (!similarEvents.length) return;

        if (similarEvents.length > 1)
            console.warn("multiple events seem identicals" + JSON.stringify({ evt, identicalEvents: similarEvents }));

        const otherEvent = similarEvents.at(0);
        removed.splice(removed.indexOf(otherEvent), 1);
        evt.id = otherEvent.id;
    });
}

export default function getEvents([fromfn, tofn]) {
    const from = getAndFilterEventsFromFile(fromfn)
    const to = getAndFilterEventsFromFile(tofn)
    reconcileEvents(from, to);
    return [from, to]
}