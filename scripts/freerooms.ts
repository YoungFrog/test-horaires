const path = require('path')

const DAWN_OF_TIME = new Date(0)
const END_OF_TIME = new Date(1e13)

interface RoomType {
  code: string
}
interface InputEventType {
  start: Date
  end: Date
  salles?: RoomType[]
}

interface OutputEventType {
  start: Date
  end: Date
  location: string
  title: string
}

const eventsfile = process.argv.at(2)

if (!eventsfile) {
  throw Error('No events.json provided.')
}
const events: InputEventType[] = require(path.resolve(eventsfile))

events.forEach((e: InputEventType) => {
  e.start = new Date(e.start)
  e.end = new Date(e.end)
})

const allRoomCodes: string[] = Array.from(
  new Set(
    events
      .flatMap(event => event.salles)
      .filter(t => !!t)
      .map(salle => salle!.code)
  )
)
allRoomCodes.sort()

function findFreeRoomEvents(
  events: InputEventType[],
  allRoomCodes: string[]
): OutputEventType[] {
  const freeRoomEvents: OutputEventType[] = []

  allRoomCodes.forEach(roomCode => {
    const roomEvents = events.filter(event =>
      event.salles?.map(salle => salle.code).includes(roomCode)
    )
    roomEvents.sort((a, b) => a.start.getTime() - b.start.getTime())

    let currentFree = {
      start: DAWN_OF_TIME,
      end: DAWN_OF_TIME,
      location: roomCode,
      title: roomCode
    }

    let currEvent: InputEventType | undefined
    while ((currEvent = roomEvents.shift())) {
      if (currEvent.start < currentFree.end) {
        console.error('unexpected', currEvent, currentFree)
        continue
      }
      currentFree.end = currEvent.start

      freeRoomEvents.push(currentFree)

      currentFree = {
        start: currEvent.end,
        end: currEvent.end,
        title: roomCode,
        location: roomCode
      }
    }
    currentFree.end = END_OF_TIME
    freeRoomEvents.push(currentFree)
  })

  return freeRoomEvents
}

function condenseEvents(freeRoomsEvents: OutputEventType[]): OutputEventType[] {
  const result: OutputEventType[] = []
  freeRoomsEvents.sort((a, b) => a.start.getTime() - b.start.getTime())

  while (freeRoomsEvents.length) {
    const curStart = freeRoomsEvents[0].start

    const curEnd = new Date(
      Math.min(
        ...freeRoomsEvents
          .flatMap(e => [e.start.getTime(), e.end.getTime()])
          .filter(t => t !== curStart.getTime())
      )
    )

    if (curStart.getTime() === curEnd.getTime()) {
      console.error(curStart, curEnd)
      throw Error('unexpected curStart == curEnd' + curStart)
    }

    const sallesCodes: string[] = []
    for (const event of freeRoomsEvents) {
      if (event.start.getTime() === curStart.getTime()) {
        sallesCodes.push(event.location)
        event.start = curEnd
      }
    }

    sallesCodes.sort()

    const freeevent = {
      start: curStart,
      end: curEnd,
      location: explainSalles(sallesCodes),
      title: explainSalles(sallesCodes)
    }

    result.push(freeevent)
    freeRoomsEvents = [
      ...freeRoomsEvents.filter(e => e.start.getTime() < e.end.getTime())
    ]
  }

  return result
}

function arraysEqual(a: any[], b: any[]) {
  if (a === b) return true
  if (a == null || b == null) return false
  if (a.length !== b.length) return false

  // If you don't care about the order of the elements inside
  // the array, you should sort both arrays here.
  // Please note that calling sort on an array will modify that array.
  // you might want to clone your array first.

  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false
  }
  return true
}

function explainSalles(codes: string[]) {
  codes.sort()
  allRoomCodes.sort()
  if (arraysEqual(codes, allRoomCodes)) return 'tous'
  return codes.join(', ')
}

const freeRoomsEvents = condenseEvents(findFreeRoomEvents(events, allRoomCodes))

console.log(JSON.stringify(freeRoomsEvents))
