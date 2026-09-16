const STORAGE_KEY = 'pipewise-id-sequences-v1'

function loadSequences() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY))
    return saved && typeof saved === 'object' ? saved : {}
  } catch {
    return {}
  }
}

function sequenceFromId(id, prefix, year) {
  const match = id.match(
    new RegExp(`^${prefix}-${year}-(\\d{4,})$`, 'i'),
  )

  return match ? Number(match[1]) : 0
}

export function generateNextId(prefix, existingIds = []) {
  const year = new Date().getFullYear()
  const sequenceKey = `${prefix}-${year}`
  const savedSequences = loadSequences()
  const highestExisting = existingIds.reduce(
    (highest, id) => Math.max(
      highest,
      sequenceFromId(id, prefix, year),
    ),
    0,
  )
  const nextSequence = Math.max(
    Number(savedSequences[sequenceKey] ?? 0),
    highestExisting,
  ) + 1

  return `${prefix}-${year}-${String(nextSequence).padStart(4, '0')}`
}

export function recordGeneratedId(id) {
  const match = id.match(/^([A-Z]{2})-(\d{4})-(\d{4,})$/i)

  if (!match) {
    return
  }

  const [, prefix, year, sequence] = match
  const sequenceKey = `${prefix.toUpperCase()}-${year}`
  const savedSequences = loadSequences()

  savedSequences[sequenceKey] = Math.max(
    Number(savedSequences[sequenceKey] ?? 0),
    Number(sequence),
  )

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(savedSequences),
  )
}

export const sensorTypePrefixes = {
  'Pressure sensor': 'PS',
  'Flow meter': 'FM',
  'Acoustic leak sensor': 'AL',
  'Water-quality sensor': 'WQ',
  'Valve controller': 'VC',
  Gateway: 'GW',
  'Valve station': 'VS',
}
