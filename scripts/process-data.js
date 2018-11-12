'use strict'
const utils = require('./utils')

// Process chart data and turn empty string in null
function processRawCharts (charts) {
  return charts.map(c => utils.emptyStringsNull(c))
}

// Process raw geographies and add region meta-data to each of them
function processRawGeographies (geographies, regions) {
  return geographies.map(geo => {
    let region = regions.find(r => r.id === geo.region)
    return {
      iso: geo.id.toLowerCase(),
      name: geo.name,
      grid: geo.grid,
      region: {
        id: region.id,
        name: region.name
      }
    }
  })
}

// Process raw investment data
// Aggregate values by year, sector and geography
function processRawInvestments (data) {
  // The data contains data for funky years. Filter those out.
  const cleanedData = data
    .filter(d => Number(d.year) > 2000 && Number(d.year) < 2100)

  // Get the years with investment data across the dataset.
  // Not all countries have investments in all years.
  const years = [...cleanedData]
    .map(d => Number(d.year))
    .reduce((acc, b) => !acc.includes(b) ? acc.concat(b) : acc, [])
    .sort()

  return [...cleanedData]
    .reduce((acc, b) => {
      let v = {
        year: Number(b.year),
        value: Number(b.value)
      }

      let match = acc.find(o => o.geography === b.geography)
      if (!match) {
        return acc.concat({
          id: 'investment',
          subindicator: 'Investment',
          geography: b.geography,
          values: [v]
        })
      } else {
        // The input data can contain multiple investments for the same year,
        // sector, geography. Aggregate these.
        let yrMatch = match.values.find(v => v.year === Number(b.year))

        if (yrMatch) {
          yrMatch.value += Number(b.value)
        } else {
          match.values = match.values.concat(v)
        }
        return acc
      }
    }, [])
    .map(geo => ({ ...geo, values: utils.fillMissingValues(geo.values, years) }))
}

// Process the annual scores. Add an indication of the year to each
// object in the array, and cast rank score to number
function processRawScores (scores, yr) {
  return scores.map(d => {
    // No need to keep score around
    const { score, ...newD } = d

    return {
      ...newD,
      rank: Number(d.rank),
      value: Number(d.score),
      year: yr
    }
  })
}

// Process sub-indicator data
function processRawSubindicators (data) {
  const years = utils.getYears(data[0])

  return data.map(d => {
    let values = years
      .map(y => ({
        value: utils.parseValue(d[y]),
        year: Number(y)
      }))

    return {
      id: d.id,
      category: d.category,
      indicator: d.indicator,
      subindicator: d.subindicator,
      geography: d.geography,
      units: d.units,
      note: d.note,
      values: utils.orderByYear(values)
    }
  })
}

// Process topics
function processRawTopics (topics) {
  return topics.map(t => ({ ...t, weight: Number(t.weight) }))
}

module.exports = {
  charts: processRawCharts,
  geographies: processRawGeographies,
  investments: processRawInvestments,
  scores: processRawScores,
  subindicators: processRawSubindicators,
  topics: processRawTopics
}