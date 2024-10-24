import fs from 'fs';
import path from 'path';
import ics from 'ics';


/**
 * Geenerates ics files for profs, gruopes, salles, cours from the events.json.
 * Input :  - icalroot, output directory for the ics files
 *          - events.json file path    
 */

if (process.argv.length !== 5)
    throw new Error("Give path to ical root then path to file events.json, e.g. ./ical/ config/events.json")

const icalRoot = path.resolve(process.argv[2])
const eventsJsonFile = path.resolve(process.argv[3])
const calendarsJsonFile = path.resolve(process.argv[4])

const config = {
  default: 'groupes',
  root: path
      .relative(path.resolve('.'), icalRoot)
      .replace(/\/?$/, '/'), // ensure trailing slash
  data: {}
}
function record (bucket, key, valueObject) {
  bucket[key] = valueObject
}





/* List of maps with:
  - key : profs/groupes/salles/cours
  - value: a list of events they attend.

  we build icss then generate ics files from its content.
*/
const icss = {}

// maps containing the profs/groupes/salles as key, and the list of their classes as value
icss.profs = {} 
icss.groupes = {}
icss.salles = {}
icss.cours = {}
var profs = icss.profs
var groupes = icss.groupes
var salles = icss.salles
var cours = icss.cours

fs.readFile(eventsJsonFile, 'utf-8', (err, data) => {
  if (err) throw err
  
  //parse the json file
  const events = JSON.parse(data)

  /*
   for each event, we extract the teachers/groupes/salles
   and for each of them we add the event as an ics value. 
  */
   events.forEach(event => {
    var icsEvent = getIcsEvent(event, "profs")
    addEvent(event.profacros || event.profs, profs, icsEvent)
    icsEvent = getIcsEvent(event, "groupes") // title of event changes according to type.
    addEvent(event.groupes, groupes, icsEvent)
    icsEvent = getIcsEvent(event, "salles")
    addEvent(event.lieux, salles, icsEvent)
    icsEvent = getIcsEvent(event, "cours")
    addEvent([event.cours], cours, icsEvent)
  })
  
console.log("generating all ics files: ")
console.log(Object.keys(profs).length+" profs")
console.log(Object.keys(groupes).length+" groupes")
console.log(Object.keys(salles).length+" salles")
console.log(Object.keys(cours).length+" cours")

generateIcss(profs, "profs")  
generateIcss(groupes, "groupes")
generateIcss(salles, "salles")
generateIcss(cours, "cours")

fs.writeFile(calendarsJsonFile, JSON.stringify(config), (err) => {
  if (err) throw err;
});
console.log('calendar.json')

})

/**
 * Generates ics files based on the list.
 * The list contains keys and a list of events as value.
 * The key will be the file name
 * The values will be transformed in vcalendar.
 * @param {*} list 
 */
function  generateIcss(list, type) {
  const items = {} // items list in config.

  for (const key in list) {
    ics.createEvents(list[key], (error, value) => {
      if (error) {
        console.log(error)
        return
      }
      const filePath = `${icalRoot}/${type}/${key}.ics`
      fs.writeFile(filePath, value, (err) => {
        if (err) throw err;
        console.log(`${key}.ics`);
      });

      const name = key // should be different for profs: ARO - Anne Rousseau (and maybe for all)
      const calendar = path.relative(config.root, path.resolve(icalRoot, filePath))

      record(items, key, { // item (1 cours, 1 prof)
        name,
        calendar
      })
    })
  }
  record(config.data, type, { //add itemList (les profs, les cours...) to config
    name: type,
    items: Object.fromEntries(Object.entries(items).sort()) // this is dirty, definitely not future-proof (trying to impose an order on key-value pairs in an object is obviously stupid)
    })
  
}

/**
 * The listIn contains the elements (groupes/profs/salles)
 * that participate in an event.
 * The icsEvent will be added as value to the element (the key) in the map  
 * @param {*} listIn 
 * @param {*} map 
 * @param {*} icsEvent 
 */
function addEvent(listIn, map, icsEvent) {
  if(listIn) {
    listIn.forEach(element => {
          if(!map[element]) map[element]=[]
          map[element].push(icsEvent);
      })
  }
}

/**
 * Returns an event object as expected by the ics library.
 * 
 * Relevant attributes: star, end, title, description, location, uid.
 * and maybe also: geo, url, status, organizer, attendees, categories,
 * recurrenceRule, lastModified, htmlContent (TODO check).
 * https://www.npmjs.com/package/ics
 * 
 * @param {*} event 
 * @param {*} type
 * @returns 
 */
function getIcsEvent(event, type) {
  return {
    start: getDateAsArray(new Date(event.start)),
    end:  getDateAsArray(new Date(event.end)),
    title: getTitle(event, type),
    description: (event.description) ? event.description : "-",
    location: event.lieux + "",
    uid: event.id
  }
}

function getTitle(event, type) {
  const formatter = new Intl.ListFormat('fr', {style: 'narrow', type: 'unit' })
  const groupes = formatter.format(event.groupes)
  const profs = formatter.format(event.profacros)
  const locations = formatter.format(event.lieux || "")
  const aa = event.aa

  switch(type) {
    case "salles":   
    case "cours":  return aa + " - " + profs + " - " +  groupes + " - " + locations
    case "profs":  return aa + " - " + groupes + " - " + locations
    case "groupes":  return aa + " - " + profs +" - "+ locations
  }
}

/**
 * returns an array representing a datetime 
 * as expected by the ics library.
 * @param {*} date 
 * @returns 
 */
function getDateAsArray(date) {
  return [date.getFullYear(), 
          date.getMonth()+1, 
          date.getDate(), 
          date.getHours(), 
          date.getMinutes()]
}


