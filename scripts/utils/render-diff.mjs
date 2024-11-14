import jdt from 'json-diff-ts';


/**
 * @typedef {{code: string, name?: string}} Resource
 * @typedef {{cours?: Resource[], salles?: Resource[], profs?: Resource[], groupes?: Resource[], start: string, end: string, id: string, description: string}} HoraireEvent
 * @typedef {{cours?: string[], salles?: string[], profs?: string[], groupes?: string[], start: string, end: string, id: string }} InternalEvent - we remove some things to simplify the diff
 */


/**
 * 
 * @param {string[]} resources 
 * @returns 
 */
function renderResources(resources) {
    return resources ? resources.join(' ') : "ERREUR"
}

/**
 * 
 * @param {InternalEvent} event 
 * @returns 
 */
function renderEvent(event) {
    const format = str => new Intl.DateTimeFormat('fr-BE', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Brussels', }).format(new Date(str))
    return `${format(event.start)} - ${format(event.end)} - ${renderResources(event.cours)} - ${renderResources(event.salles)} - ${renderResources(event.profs)} - ${renderResources(event.groupes)}`
}

/**
 * 
 * @param {{key: string; oldValue: any; value: any; }[]} modifications 
 */

function renderModifications(modifications) {
    return modifications.map(renderModification).join(', ')
}

function renderModification(modification) {
    switch (modification.type) {
        case 'UPDATE':
            return `${modification.key} : ${JSON.stringify(modification.oldValue)} → ${JSON.stringify(modification.value)}`
        case 'ADD':
            return `${modification.key} += ${JSON.stringify(modification.value)}`
        case 'REMOVE':
            return `${modification.key} -= ${JSON.stringify(modification.value)}`
        default:
            return `ERREUR - ${modification.key} - ${JSON.stringify(modification)}`

    }
}

function log(obj) {
    console.dir(obj, { depth: null })
}


export default function renderDiff(from, to) {
    const diffs = jdt.diff(from, to, { embeddedObjKeys: { '': 'id' } })

    if (diffs.length > 1)
        throw Error("Too many diffs", diffs.length)

    const changes = diffs.length == 1 ? diffs[0].changes : []

    const cnt = { added: 0, removed: 0, updated: 0 }

    for (let difference of changes) {
        switch (difference.type) {
            case "UPDATE":
                const event = to.find(e => e.id === difference.key)

                const modifiedKeys = difference.changes.flatMap(change => {
                    const atoms = jdt.atomizeChangeset(change)
                    atoms.forEach(atom => atom.key = change.key)
                    return atoms
                })
                console.log(`UPDATED : ${renderModifications(modifiedKeys)} (event: ${renderEvent(event)})`)
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
                console.log("ERREUR", difference)
                break;
        }
    }

    console.log("Différences: ", cnt);

}