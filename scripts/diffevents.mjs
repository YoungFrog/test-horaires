import renderDiff from './utils/render-diff.mjs'
import getopt from 'node-getopt'
import getEvents from './utils/deduplicated-events.mjs'

let opt = getopt.create([]).bindHelp().parseSystem();

if (opt.argv.length !== 2) {
    throw Error("Needs exactly two arguments old.event.json and new.event.json")
}

const [from, to] = getEvents(opt.argv)

renderDiff(from, to)