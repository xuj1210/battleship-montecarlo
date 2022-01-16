let playerStats = document.getElementById('player-stats');
let aiStats = document.getElementById('ai-stats');

import { updateAiStats, getAiStats } from "./database";

const AI = await getAiStats();
console.log(AI);