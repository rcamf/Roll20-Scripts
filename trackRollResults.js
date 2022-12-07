const SCRIPT_NAME = "!trackRollResults "
const SAVING_INTERVAL_MS = 600000
const RESULT_HANDOUT_NAME = "Roll Result Tracker"
const DEBUG = false

let getHandoutNotes = (handout) => {
    return new Promise((resolve, reject) => { // Wrapped getting notes in promise because of infinite call stack error
        try {
            if (DEBUG) {
                log("GetHandoutNotes: " + handout)
            }
            handout.get("notes", (notes) => {
                if (DEBUG) {
                    log("GetHandoutNotes: Found " + notes)
                }
                resolve(notes)
            })
        } catch (error) {
            if (DEBUG) {
                log("ERROR:" + error.message)
            }
            reject(undefined)
        }
    })
}

async function saveStateToHandout () {
    if (DEBUG) {
        log("SaveStateToHandout: Checking whether " + RESULT_HANDOUT_NAME + " exists")
    }
    const saveHandout = findObjs({type: "handout", name: RESULT_HANDOUT_NAME})
    if (saveHandout.length > 0) {
        const notes = await getHandoutNotes(saveHandout[0])
        if (notes) {
            const prevResults = JSON.parse(notes)
            const newResults = prevResults.concat(state.rolls)
            if (DEBUG) {
                log("SaveStateToHandout: Saving new results to existing handout.\n\tNew Results: " + newResults)
            }
            log(newResults)
            saveHandout[0].set({
                notes: JSON.stringify(newResults)
            })
        }
    } else {
        const createdHandout = createObj("handout", {
            name: RESULT_HANDOUT_NAME,
            inplayerjournals: "all"
        })
        if (DEBUG) {
            log("SaveStateToHandout: Saving rolls to new handout.\n\tRolls: " + state.rolls)
        }
        createdHandout.set({
            notes: JSON.stringify(state.rolls)
        })
    }
    state.rolls = []
}

on("ready", () => {
	state = {
	    rolls: []
	}
	if (DEBUG) {
	    log("Ready: " + state)
	}
	setInterval(() => {
	    saveStateToHandout()
	}, SAVING_INTERVAL_MS)
})

on("chat:message", (msg) => {
    if (DEBUG) {
        log("OnChatMessage: " + msg)
    }
	if (msg.type.endsWith("rollresult")) {
		const roll = JSON.parse(msg.content)
		const rollEntry = {
		    player_name: msg.who,
		    player_id: msg.playerid,
		    timestamp: Date.now(),
		    roll
		}
		if (DEBUG) {
            log("OnChatMessage: Saving roll result to state." + rollEntry)
        }
		state.rolls.push(rollEntry)
	} else if (msg.type === "api") {
	    if (DEBUG) {
            log("OnChatMessage: Got api message. " + msg.content)
        }
		if (msg.content.startsWith(SCRIPT_NAME)) {
		    const command = msg.content.slice(SCRIPT_NAME.length)
		    if (command === "saveToHandout") {
		        if (DEBUG) {
                    log("OnChatMessage: User decided save to handout. " + command)
                }
		        saveStateToHandout()
		    }
		}
	}
})