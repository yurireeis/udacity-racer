// PROVIDED CODE BELOW (LINES 1 - 80) DO NOT REMOVE

// The store will hold all information needed globally
const RACE_STATUS = Object.freeze({
	UNSTARTED: 'unstarted',
	IN_PROGRESS: 'in-progress',
	FINISHED: 'finished',
})

let store = {
	track_id: undefined,
	player_id: undefined,
	race_id: undefined,
	race_status: RACE_STATUS.UNSTARTED
}

// We need our javascript to wait until the DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
	onPageLoad()
	setupClickHandlers()
})

const errorHandler = (message, err) => alert(`${message}\n${err}`)

async function onPageLoad() {
	try {
		getTracks()
			.then(tracks => {
				const html = renderTrackCards(tracks)
				renderAt('#tracks', html)
			})

		getRacers()
			.then((racers) => {
				const html = renderRacerCars(racers)
				renderAt('#racers', html)
			})
	} catch (error) {
		console.log("Problem getting tracks and racers ::", error.message)
		console.error(error)
	}
}

function setupClickHandlers() {
	document.addEventListener('click', function (event) {
		const { target } = event

		// Race track form field
		if (target.matches('.card.track')) {
			handleSelectTrack(target)
		}

		// Podracer form field
		if (target.matches('.card.podracer')) {
			handleSelectPodRacer(target)
		}

		// Submit create race form
		if (target.matches('#submit-create-race')) {
			event.preventDefault()

			// start race
			handleCreateRace()
		}

		// Handle acceleration click
		if (target.matches('#gas-peddle')) {
			handleAccelerate()
		}

	}, false)
}

async function delay(ms) {
	try {
		return await new Promise(resolve => setTimeout(resolve, ms));
	} catch (error) {
		console.log("an error shouldn't be possible here")
		console.log(error)
	}
}
// ^ PROVIDED CODE ^ DO NOT REMOVE

// This async function controls the flow of the race, add the logic and error handling
async function handleCreateRace() {
	// render starting UI

	// TODO - Get player_id and track_id from the store
	const { player_id = 0, track_id = 0 } = store

	const trackId = parseInt(track_id, 10)
	const playerId = parseInt(player_id, 10)

	if (!playerId || !trackId) { return alert('please select:\n- player\n- track') }

	const [{ value: tracks }, { value: racers }] = await Promise.allSettled([getTracks(), getRacers()])

	const selectedTrack = tracks.find(({ id }) => trackId === id)
	const selectedPlayer = racers.find(({ id }) => playerId === id)

	renderAt('#race', renderRaceStartView(selectedTrack, racers))

	// const race = TODO - invoke the API call to create the race, then save the result
	const result = await createRace(playerId, trackId)
	const { ID: id } = result
	const currentRaceId = id - 1

	// TODO - update the store with the race id
	// For the API to work properly, the race id should be race id - 1
	Object.assign(store, { race_id: currentRaceId })

	// The race has been created, now start the countdown
	// TODO - call the async function runCountdown
	await runCountdown()

	// TODO - call the async function startRace
	await startRace(currentRaceId)

	Object.assign(store, { race_status: RACE_STATUS.IN_PROGRESS })

	// TODO - call the async function runRace
	await runRace(currentRaceId)
}

const raceInfo = async (id) => {
	const { status, progress, positions } = await getRace(id)
	/* 
		TODO - if the race info status property is "in-progress", update the leaderboard by calling:
	
		renderAt('#leaderBoard', raceProgress(res.positions))
	*/

	/* 
		TODO - if the race info status property is "finished", run the following:
	
		clearInterval(raceInterval) // to stop the interval from repeating
		renderAt('#race', resultsView(res.positions)) // to render the results view
		resolve(res) // resolve the promise
	*/

	switch (status) {
		case RACE_STATUS.IN_PROGRESS: return Promise.resolve(renderAt('#leaderBoard', raceProgress(positions)))
		case RACE_STATUS.FINISHED:
			clearInterval(raceInterval) // to stop the interval from repeating
			renderAt('#race', resultsView(positions)) // to render the results view
			return Promise.resolve({ status, progress })
				.then(() => Object.assign(store, { race_status: RACE_STATUS.FINISHED }))
				.catch((err) => errorHandler("some error happened to finish the race", err))
		default:
			return Promise.reject({ status, progress, message: 'race has not started yet' })
	}
}

function runRace(raceID) {
	return new Promise(resolve => {
		// TODO - use Javascript's built in setInterval method to get race info every 500ms
		setInterval(raceInfo, 500, raceID)
	})
		.catch((err => errorHandler("something wrong happened with your run race attempt", err)))
	// remember to add error handling for the Promise
}

async function runCountdown(timer = 3) {

	try {
		if (!timer) {
			document.getElementById('big-numbers').innerHTML = "GO!"
			return Promise.resolve()
		}

		// wait for the DOM to load
		await delay(1000)

		return new Promise(resolve => {
			// TODO - use Javascript's built in setInterval method to count down once per second
			// run this DOM manipulation to decrement the countdown for the user
			document.getElementById('big-numbers').innerHTML = timer - 1
			return resolve(runCountdown(timer - 1))

			// TODO - if the countdown is done, clear the interval, resolve the promise, and return
		})
	} catch (error) {
		errorHandler("something wrong happened with countdown to start the run")
	}
}

function handleSelectPodRacer(target) {
	console.log("selected a pod", target.id)

	// remove class selected from all racer options
	const selected = document.querySelector('#racers .selected')
	if (selected) {
		selected.classList.remove('selected')
	}

	// add class selected to current target
	target.classList.add('selected')

	// TODO - save the selected racer to the store
	Object.assign(store, { player_id: target.id })
}

function handleSelectTrack(target) {
	console.log("selected a track", target.id)

	// remove class selected from all track options
	const selected = document.querySelector('#tracks .selected')
	if (selected) {
		selected.classList.remove('selected')
	}

	// add class selected to current target
	target.classList.add('selected')

	// TODO - save the selected track id to the store
	Object.assign(store, { track_id: target.id })
}

function handleAccelerate() {
	const { race_status } = store
	if (RACE_STATUS.UNSTARTED === race_status) { return; }
	console.log("accelerate button clicked")
	// TODO - Invoke the API call to accelerate
	const { race_id: id } = store
	accelerate(id)
}

// HTML VIEWS ------------------------------------------------
// Provided code - do not remove

function renderRacerCars(racers) {
	if (!racers.length) {
		return `
			<h4>Loading Racers...</4>
		`
	}

	const results = racers.map(renderRacerCard).join('')

	return `
		<ul id="racers">
			${results}
		</ul>
	`
}

function renderRacerCard(racer) {
	const { id, driver_name, top_speed, acceleration, handling } = racer

	return `
		<li class="card podracer" id="${id}">
			<h3>${driver_name}</h3>
			<p>${top_speed}</p>
			<p>${acceleration}</p>
			<p>${handling}</p>
		</li>
	`
}

function renderTrackCards(tracks) {
	if (!tracks.length) {
		return `
			<h4>Loading Tracks...</4>
		`
	}

	const results = tracks.map(renderTrackCard).join('')

	return `
		<ul id="tracks">
			${results}
		</ul>
	`
}

function renderTrackCard(track) {
	const { id, name } = track

	return `
		<li id="${id}" class="card track">
			<h3>${name}</h3>
		</li>
	`
}

function renderCountdown(count) {
	return `
		<h2>Race Starts In...</h2>
		<p id="big-numbers">${count}</p>
	`
}

function renderRaceStartView(track, racers) {
	return `
		<header>
			<h1>Race: ${track.name}</h1>
		</header>
		<main id="two-columns">
			<section id="leaderBoard">
				${renderCountdown(3)}
			</section>

			<section id="accelerate">
				<h2>Directions</h2>
				<p>Click the button as fast as you can to make your racer go faster!</p>
				<button id="gas-peddle">Click Me To Win!</button>
			</section>
		</main>
		<footer></footer>
	`
}

function resultsView(positions) {
	positions.sort((a, b) => (a.final_position > b.final_position) ? 1 : -1)

	return `
		<header>
			<h1>Race Results</h1>
		</header>
		<main>
			${raceProgress(positions)}
			<a href="/race">Start a new race</a>
		</main>
	`
}

function raceProgress(positions) {
	const playerId = parseInt(store.player_id)
	const userPlayer = positions.find(e => e.id === playerId)
	Object.assign(userPlayer, { driver_name: userPlayer.driver_name += " (you)" })

	positions = positions.sort((a, b) => (a.segment > b.segment) ? -1 : 1)
	let count = 1

	const results = positions.map(p => {
		return `
			<tr>
				<td>
					<h3>${count++} - ${p.driver_name}</h3>
				</td>
			</tr>
		`
	})

	return `
		<main>
			<h3>Leaderboard</h3>
			<section id="leaderBoard">
				${results}
			</section>
		</main>
	`
}

function renderAt(element, html) {
	const node = document.querySelector(element)

	node.innerHTML = html
}

// ^ Provided code ^ do not remove


// API CALLS ------------------------------------------------

const SERVER = 'http://localhost:3001'

function defaultFetchOpts() {
	return {
		mode: 'cors',
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': SERVER,
		},
	}
}

// TODO - Make a fetch call (with error handling!) to each of the following API endpoints 

const getTracks = async () => {
	// GET request to `${SERVER}/api/tracks`
	try {
		const url = `${SERVER}/api/tracks`
		const response = await fetch(url, { method: 'GET', redirect: 'follow' })
		return response.json()
	} catch (error) {
		errorHandler("something wrong happened with get tracks attempt", error)
	}
}

const getRacers = async () => {
	// GET request to `${SERVER}/api/cars`
	try {
		const url = `${SERVER}/api/cars`
		const response = await fetch(url, { method: 'GET', redirect: 'follow' })
		return response.json()
	} catch (error) {
		errorHandler("something wrong happened with get racers attempt", error)
	}
}

const createRace = async (player_id, track_id) => {
	try {
		const response = await fetch(`${SERVER}/api/races`, {
			method: 'POST',
			...defaultFetchOpts(),
			dataType: 'jsonp',
			body: JSON.stringify({ player_id: parseInt(player_id, 10), track_id: parseInt(track_id, 10) })
		})
		return response.json()
	} catch (error) {
		errorHandler("something wrong happened with create race attempt", error)
	}
}

const getRace = async (raceId) => {
	try {
		const url = `${SERVER}/api/races/${raceId}`
		const response = await fetch(url, { method: 'GET', redirect: 'follow' })
		return response.json()
	} catch (error) {
		errorHandler("something wrong happened with get tracks attempt", error)
	}
}

const startRace = async (raceId) => {
	const url = `${SERVER}/api/races/${raceId}/start`
	try {
		await fetch(url, { method: 'POST', ...defaultFetchOpts(), redirect: 'follow' })
	} catch (error) {
		errorHandler("something wrong happened with start race attempt", error)
	}
}

const accelerate = async (raceId) => {
	// POST request to `${SERVER}/api/races/${id}/accelerate`
	// options parameter provided as defaultFetchOpts
	// no body or datatype needed for this request
	try {
		const url = `${SERVER}/api/races/${raceId}/accelerate`
		const response = await fetch(url, {
			method: 'POST',
			...defaultFetchOpts(),
		})
		return response.json()
	} catch (error) {
		errorHandler("something wrong happened with accelerate attempt", error)
	}
}
