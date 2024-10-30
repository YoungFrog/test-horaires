#!/usr/bin/env node
"use strict"

import fs from 'fs';
import path from 'path';
import getopt from 'node-getopt';
import ical from 'ical';
import { parseDesc } from './parseDescription.mjs';


/**
 * parse an ics file into an array of events, including information parsed from the description and the filename
 *
 * @param {string} fn an .ics filename
 * @returns {object[]} an array of events
 */
function getEventsFromFile(fn) {

    const { code, name } = parseFilename(fn)

    return Object.values(ical.parseFile(fn))
        .filter(event => event.type === 'VEVENT')
        .map(event => ({
            start: event.start,
            end: event.end,
            id: event.uid,
            description: event.description?.val,
            ...parseDesc(event.description?.val),
            location: event.location?.val,
            cours: [{
                code,
                name: name ? `${code} - ${name}` : code
            }]
        }));
}

/**
 * 
 * @param {string} fn a filename of the form "ALG3 Algorithmique 1.ics"
 * @returns {{code: string, name?: string}} the code and the name
 */

function parseFilename(fn) {
    const basename = path.basename(fn, '.ics')

    const pos = basename.indexOf(' ')

    if (pos > 0) {
        const code = basename.substring(0, pos)
        const name = basename.substring(pos + 1)
        return { code, name }
    } else {
        return { code: basename }
    }
}


/**
 * 
 * @param {string[]} fileNames the filenames of the courses
 * @returns an array of events, excluding holidays
 */
function parseCours(fileNames) {
    return fileNames
        .flatMap(getEventsFromFile)
        .filter(e => !(e.id.startsWith("Ferie") || e.id.startsWith("Férié")));
}


/**
 * 
 * @param {string} dir a directory path
 * @returns an array of the ics files paths within that directory
 */
function getFileNames(dir) {
    const fileNames = fs
        .readdirSync(dir)
        .filter(fn => fn.endsWith(".ics"))
        .map(fn => path.resolve(dir, fn));

    if (!fileNames.length) {
        throw Error(`No .ics files found in dir: ${dir}`);
    }

    return fileNames;
}


let opt = getopt.create([
    ['d', 'dir=ARG', 'Répertoire contenant les ics']
]).bindHelp().parseSystem();

if (opt.argv.length > 0) {
    opt.showHelp()
    throw Error("Extraneous arguments: " + opt.argv)
}

const { dir: directory } = opt.options;
const fileNames = getFileNames(directory);
const events = parseCours(fileNames)

console.log(JSON.stringify(events))
