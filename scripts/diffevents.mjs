import { readFileSync } from 'fs';
import getopt from 'node-getopt'
import jdt, { atomizeChangeset } from 'json-diff-ts';

/**
 * @typedef {{code: string, name?: string}} Resource
 */


/**
 * 
 * @param {Resource[]} resources 
 * @returns 
 */
function renderResources(resources) {
    return resources?.map ? resources.map(r => r.code).join(' ') : "ERREUR"
}

/**
 * 
 * @param {{cours?: Resource[], salles?: Resource[], profs?: Resource[], groupes?: Resource[]}} event 
 * @returns 
 */
function renderEvent(event) {
    const format = str => new Intl.DateTimeFormat('fr-BE', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Brussels', }).format(new Date(str))
    return `${format(event.start)} - ${format(event.end)} - ${renderResources(event.cours)} - ${renderResources(event.salles)} - ${renderResources(event.profs)}`
}

/**
 * 
 * @param {{key: string; oldValue: any; value: any; }[]} modifications 
 */

function renderModification(modifications) {
    return modifications.map(modification => `${modification.key} : ${modification.oldValue} → ${modification.value}`).join(', ')
}

function log(obj) {
    console.dir(obj, { depth: null })
}

let opt = getopt.create([
    // ['d', 'dir=ARG', 'Répertoire contenant les ics']
]).bindHelp().parseSystem();

if (opt.argv.length !== 2) {
    throw Error("Needs exactly two arguments old.event.json and new.event.json")
}

const [from, to] = opt.argv.map(fn => {
    const array = JSON.parse(readFileSync(fn))
    array.forEach(event => {
        delete event['description']
    });

    const nb_of_ids = new Set(array.map(e => e.id)).size
    if (array.length !== nb_of_ids) {
        throw Error(`events with duplicate ids found in ${fn} (${array.length} elements but ${nb_of_ids} ids)`)
    }

    return array
})

const diffs = jdt.diff(from, to, { embeddedObjKeys: { '': 'id' } })

const changes = diffs.length ? diffs[0].changes : []
const cnt = { added: 0, removed: 0, updated: 0 }

for (let difference of changes) {
    // log(difference)
    switch (difference.type) {
        case "UPDATE":
            // const fromEvent = from.find(e => e.id === difference.key)
            const event = to.find(e => e.id === difference.key)
            const modifiedKeys = difference.changes.map(change => {
                const { oldValue, value } = atomizeChangeset(change)[0] // même si code et name ont changé, un seul nous suffit.
                return {
                    key: change.key,
                    oldValue,
                    value
                }
            })
            console.log(`UPDATED : ${renderModification(modifiedKeys)} (event: ${renderEvent(event)})`)
            cnt.updated++
            break;

        case "ADD":
            console.log(`NEW event: ${renderEvent(difference.value)}`)
            cnt.added++
            break;

        case "REMOVE":
            console.log(`REMOVED event: ${renderEvent(difference.value)}`)
            cnt.removed++
            break;

        default:
            console.log("UNKOWN", difference)
            break;
    }
}

console.log("Différences: ", cnt);
