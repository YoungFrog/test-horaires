#!/usr/bin/env node
"use strict"

import fs from 'fs';
import path from 'path';

import getopt from 'node-getopt';
import parseCours from './parseIcs.mjs';

let opt = getopt.create([
    ['d', 'dir=ARG', 'Répertoire contenant les ics']
]).bindHelp().parseSystem();

if (opt.argv.length > 0) {
    opt.showHelp()
    throw Error("Extraneous arguments: " + opt.argv)
}

const { dir } = opt.options;
const fileNames = getFileNames(dir);

if (!fileNames.length) {
    console.warn(`No .ics files found in dir: ${dir}`);
    process.exit(1);
}

const events = parseCours(fileNames)
    .filter(e => !e.id.startsWith("Ferie"))

console.log(JSON.stringify(events))

function getFileNames(dir) {
    const fileNames = fs
        .readdirSync(dir)
        .filter(fn => fn.endsWith(".ics"))
        .map(fn => path.resolve(dir, fn));


    return fileNames;
}
