const serverUrl = "http://localhost:3000";

let updateAiStats = async (aiWon, moveCount) => {
  const DATA = {
    won: aiWon,
    moveCount: moveCount
  }
  const OPTIONS = {
    method: "PUT",
    mode: "cors",
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(DATA)
  }
  fetch(serverUrl + "/ai-stats", OPTIONS).then(res => { console.log(res) });
}

let getAiStats = async () => {
  let OPTIONS = {
    method: "GET",
    mode: "cors"
  }
  let stats = await fetch(serverUrl + "/ai-stats", OPTIONS)
  .then(res => res.json())
  return stats[0];
}

export { updateAiStats, getAiStats }

