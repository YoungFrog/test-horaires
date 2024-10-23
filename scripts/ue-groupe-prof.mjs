#!/usr/bin/env node
"use strict"

import fs from 'fs';
import path from 'path';

import getopt from 'node-getopt';

/* 

   input: fichier json avec les événements (parsé par getEvents.mjs)
   output : dictionnaire de {groupe: acronyme}

   Le but est de voir qui est le prof associé à chaque groupe dans les événements sélectionnés.
   

*/

let opt = getopt.create([
    ['u', 'ue=ARG', 'Regexp comparée au nom de l\'AA']
]).bindHelp().parseSystem();

if (opt.argv.length != 1) {
    opt.showHelp()
    throw Error('must give exactly one JSON file name containing events ');
}

let file = opt.argv[0]
const { ue: aaregexp } = opt.options;

let events = JSON.parse(fs.readFileSync(path.resolve(file)))

let dict = {}
for (let event of events) {
    /**
     * @type {string}
     */
    let aa = event.aa;
    if (aaregexp && !aa.match(new RegExp(aaregexp, 'i'))) continue
    if (event.profacros.length > 1) {
        console.error("prof acro > 1 for event: ", event);
        continue
    }
    let acro = event.profacros[0]
    let groupe = event.groupes // étrangeté de getEvents ; ceci devrait être un tableau !
    if (dict[groupe] && dict[groupe] !== acro) {
        console.error("groupe", groupe, "has multiple profs: ", acro, dict[groupe]);
        continue
    }
    dict[groupe] = acro
}
console.log(dict);

