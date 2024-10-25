// interface EventAttributes {
//   aa?: string,
//   groupes?: string[],
//   profs?: string[],
//   profacro?: string[],
//   salles?: string[],
//   type?: string
// }

const parseDesc = (description) => {
  const obj = {}
  // chaque ligne de /description/ est de la forme: "truc : valeur"

  if (!description) return obj

  for (const item of description.split('\n')) {
    let [key, value] = item.split(' : ')
    if (!value) continue

    switch (key) {
      case 'Matière':
        obj.cours = [{ code: value, name: value }]
        break
      case 'TD':
      case 'Promotion':
      case 'Promotions':
        obj.groupes = value
          .split(', ')
          .map(groupe => ({ code: groupe, name: groupe }))
        break
      case 'Enseignant':
      case 'Enseignants':
        key = 'profs'
        obj.profs = value.split(', ').map(prof => {
          const [code, name] = prof.split(' - ')
          return name ? { code, name: `${code} - ${name}` } : { code }
        })
        break
      case 'Salle':
      case 'Salles':
        obj.salles = value
          .split(', ')
          .map(salle => ({ code: salle, name: salle }))
        break
      case 'Type':
        obj.type = value
        break
      default:
    }
  }
  return obj
}

export { parseDesc }
export default parseDesc
