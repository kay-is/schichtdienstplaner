
// === FUNCTIONS ===

const {h, render} = window.preact

function getQueryParameter(name) {
  const url = window.location.href
  name = name.replace(/[\[\]]/g, "\\$&")
  const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)")
  const results = regex.exec(url)
  if (!results) return null
  if (!results[2]) return ''
  return decodeURIComponent(results[2].replace(/\+/g, " "))
}

function setQueryParameter(name, value){
  const url = window.location.href
  let newAdditionalURL = ""
  let tempArray = url.split("?")
  const baseURL = tempArray[0]
  const additionalURL = tempArray[1]
  let temp = ""
  if (additionalURL) {
    tempArray = additionalURL.split("&")
    for (i=0; i<tempArray.length; i++){
      if(tempArray[i].split('=')[0] != name){
        newAdditionalURL += temp + tempArray[i]
        temp = "&"
      }
    }
  }

  const rows_txt = temp + "" + name + "=" + value
  window.location = baseURL + "?" + newAdditionalURL + rows_txt
}

function getDate() {
  const year = getQueryParameter('year') || moment().format('YYYY')
  const month = getQueryParameter('month') || moment().format('MM')
  return moment(year + '-' + month + '-01')
}

function getDaysOfMonth() {
  const year = getQueryParameter('year') || moment().format('YYYY')
  const month = getQueryParameter('month') || moment().format('M')
  return new Date(year, month, 0).getDate()
}

function createShift(eventDefintion) {

  return new Promise((resolve, reject) =>
    gapi.client.calendar.events.insert(eventDefintion)
    .execute(r => r.error? reject(r.error) : resolve(r))
  )

}

function deleteShift({calendarId, eventId}) {

  if (!eventId) return Promise.resolve(null)

  return new Promise((resolve, reject) =>
    gapi.client.calendar.events.delete({calendarId, eventId})
    .execute(r => r.error? reject(r.error) : resolve(r))
  )

}

function loadShifts() {

  return new Promise((resolve, reject) => {
    gapi.client.calendar.events.list({
      calendarId: getQueryParameter('calendar') || 'primary',
      timeMin: getDate().toISOString(),
      timeMax: getDate().endOf('month').toISOString(),
      singleEvents: true,
      q: 'shift',
      orderBy: 'startTime'
    })
    .execute(r => r.error? reject(r.error) : resolve(r))
  })

}


// === COMPONENTS ===

const {Component} = window.preact

function Loading() {
  return h('h1', {class: 'text-center'}, [
    h('i', {class: 'fa fa-gear fa-spin'}),
    ' Lade Schichten...',
  ])
}

function Row(props) {
  return h('div', {class: 'row'}, props.children)
}