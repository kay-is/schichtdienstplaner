'use strict'

const CLIENT_ID = '959626286874-o4ck2ckokj5t29l4fhru22rbntgp43kb.apps.googleusercontent.com'
const SCOPE = 'https://www.googleapis.com/auth/calendar'

moment.locale('de')

function LoginButton(props) {
  return h('button', {
    onClick: props.onClick,
    class: 'btn btn-success btn-lg',
    style: {margin: 'auto', display: 'block'}
  }, 'Authorisieren')
}

const shiftTypes = {
  '6A': {start: 6, end: 14.25, description: '06:00 - 14:15'},
  '7A': {start: 7, end: 15.25, description: '07:00 - 15:15'},
  '8A': {start: 8, end: 16.25, description: '08:00 - 16:15'},
  'A20': {start: 12.75, end: 20, description: '12:45 - 20:00'},
  'A21': {start: 13.75, end: 21, description: '13:45 - 21:00'},
  'N1': {start: 20.5, end: 30.5, description: '20:30 - 06:30'},
}

class ShiftItem extends Component {

  handleClick(shiftId, date) {
    const event = this.props.event || {}

    const newShift = shiftTypes[shiftId]

    this.setState({loading: true})

    const deleted = deleteShift({
      calendarId: getQueryParameter('calendar') || 'primary',
      eventId: event.id,
    })

    if (event.summary != shiftId) {

      deleted.then(() => createShift({
        calendarId: getQueryParameter('calendar') || 'primary',
        summary: shiftId,
        description: 'shift',
        start: {
          dateTime: date.startOf('day').add(newShift.start, 'hours').toISOString(),
        },
        end: {
          dateTime: date.startOf('day').add(newShift.end, 'hours').toISOString(),
        }
      }))
      .then(() => {
        this.setState({loading: false})
        this.props.onChange()
      })
    }
    else {
      deleted.then(() => {
        this.setState({loading: false})
        this.props.onChange()
      })
    }

  }

  render({date, event = {}}, state) {

    const buttons = Object.keys(shiftTypes).map(shiftId => h('a', {
      class: 'btn ' + (event.summary == shiftId? 'btn-primary' : 'btn-default'),
      disabled: state.loading,
      onClick: () => this.handleClick(shiftId, date),
      title: (event.summary == shiftId? 'Schicht entfernen' : 'Schicht hinzufügen')
    }, [
      ' ' + shiftId,
      h('br'),
      h('small', null, shiftTypes[shiftId].description),
    ])
    )

    const rowClass = (date.format('dddd') == 'Sonntag' || date.format('dddd') == 'Samstag')
      ? 'info'
      : ''

    return h('tr', {class: rowClass},[
      h('td', {style: {width: 100}}, date.format('dddd') + ' ' + date.format('DD.MM.YYYY')),
      h('td', null,
        h('div', {class: 'btn-group btn-group-justified'}, buttons)
      )
    ])
  }
}

class DatePicker extends Component {

  handleYearChange(year) {
    setQueryParameter('year', year)
  }

  handleMonthChange(month) {
    setQueryParameter('month', month)
  }

  render(props) {

    const year = getQueryParameter('year')
    const month = getQueryParameter('month')

    const yearButtons = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025]
      .map(y => h('a', {
        class: 'btn ' + (year == y? 'btn-info' : ''),
        onClick: () => this.handleYearChange(y),
      }, '' + y))

    const monthButtons = [
      ['01', 'Jan'],
      ['02', 'Feb'],
      ['03', 'Mär'],
      ['04', 'Apr'],
      ['05', 'Mai'],
      ['06', 'Jun'],
      ['07', 'Jul'],
      ['08', 'Aug'],
      ['09', 'Sep'],
      ['10', 'Okt'],
      ['11', 'Nov'],
      ['12', 'Dez'],
    ]
    .map(m => h('a', {
      class: 'btn ' + (month == m[0]? 'btn-info' : ''),
        onClick: () => this.handleMonthChange(m[0]),
    }, m[1]))

    return h('div', null, [
      h('div', {class: 'btn-group btn-group-justified'}, yearButtons),
      h('div', {class: 'btn-group btn-group-justified'}, monthButtons),
    ])
  }
}

class ShiftList extends Component {

  constructor() {
    super()
    this.state = {
      shifts: [],
    }
  }

  componentDidMount() {

    loadShifts()
    .then(r => {
      const events = r.items
      const days = getDaysOfMonth()

      const shifts = []
      for(let d = 1; d <= days; ++d) {

        let shift = {
          date: getDate().add(d - 1, 'days'),
        }
        events.forEach(event => {
          const eventDay = moment(event.start.dateTime || event.start.date).format('D')
          if (d == eventDay) shift.event = event
        })

        shifts.push(shift)
      }

      this.setState({shifts})
    })

  }

  handleDateChane(e) {
    console.debug('Date:', e)
  }

  render(props, state) {

    const days = getDaysOfMonth()

    return h('div', null, [
      h('a', {class: 'btn pull-right', href:'https://accounts.google.com/logout'}, 'Logout'),
      h(DatePicker, {onClick: e => this.handleDateChane(e)}),
      h('h3', null, 'Schichten im ' + getDate().format('MMMM YYYY')),
      h('table', {class: 'table table-hover'},
        h('tbody', null,
          state.shifts.map((shift, index) => h(ShiftItem, {
            date: shift.date,
            event: shift.event,
            onChange: () => this.componentDidMount()
          }))
        )
      )
    ])
  }
}

class App extends Component {

  constructor() {

    super()

    this.state = {
      authorized: false,
      error: '',
      loading: true,
    }

    this.checkLoginState = this.checkLoginState.bind(this)
    this.handleAuthClick = this.handleAuthClick.bind(this)

  }

  componentDidMount() {

    gapi.auth.authorize(
      {
        client_id: CLIENT_ID,
        scope: SCOPE,
        immediate: true,
      },
      this.checkLoginState.bind(this)
    )

  }

  checkLoginState(authResult) {

    if (authResult && !authResult.error) {
      gapi.client.load('calendar', 'v3', () => {
        this.setState({
          loading: false,
          authorized: true,
        })
      })
    }
    else {
      this.setState({
        loading: false,
        error: authResult.error,
      })
    }


  }

  handleAuthClick() {

    this.setState({loading: true})

    gapi.auth.authorize(
      {
        client_id: CLIENT_ID,
        scope: SCOPE,
        immediate: false
      },
      this.checkLoginState
    )

  }

  render(p, s) {

    let content


    if (this.state.loading) {
      content = h(Loading)
    }
    else if (!this.state.authorized) {

      content = h(Row, null, [
        h('h2', {class: 'text-center'}, 'Schichtdienstplaner braucht Zugriff'),
        h('h2', {class: 'text-center'}, 'auf ihren Google Kalender'),
        h('br'),
        h(LoginButton, {onClick: () => this.handleAuthClick()})
      ])

    }
    else {
      content = h(ShiftList)
    }

    return h('div', {class: 'container'},[
      h(Row, null, h('h1', null, [
        h('i', {class: 'fa fa-calendar'}),
        ' Schichtdienstplaner',
      ])),
      h(Row, null, content),
    ])

  }

}


function startApp() {
  const rootElement = h(App)
  const renderTarget = document.getElementById('application')
  renderTarget.innerHTML = ''
  render(rootElement, renderTarget)
}
