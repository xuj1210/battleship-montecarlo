const express = require('express');
const router = express.Router();
const AiStats = require('../models/AiStatsModel.js');

router.get('/', async (req, res) => {
  try {
    const STATS = await AiStats.find();
    res.status(200).json(STATS);
  } catch (err) {
    res.status(418).json({ message: err });
  }
});

router.put('/', async (req, res) => {
  const WON = req.body.won;
  const moveCount = req.body.moveCount;

  let issue;
  if (WON === undefined || (WON !== true && WON !== false)) {
    issue = 'WON';
  } else if (moveCount === undefined || moveCount < 17 || moveCount > 100) {
    issue = 'moveCount'
  }
  if (issue) {
    res.status(400).send(`Invalid or missing parameter '${issue}'`);
  }
  
  try {
    AiStats.find()
    .then(entries => {
      let stats = entries[0];
      ++stats.matchCount;
      if (WON) {
        ++stats.winCount;
      }
      stats.moveAvg = (stats.moveAvg * (stats.matchCount - 1) + moveCount) / stats.matchCount;
      AiStats.updateOne(
        { "_id": stats._id }, 
        {$set: { 
          "matchCount": stats.matchCount, 
          "winCount": stats.winCount, 
          "moveAvg": stats.moveAvg 
        }})
        .then(ret => { res.status(200).json(stats) })
        .catch(err => { res.status(500).send('Failed to update stats in database')})
    })
    .catch(err => { res.status(500).send('No ai stats information found'); })
  } catch (err) {
    res.status(418).json({ message: err });
  }
  // try {
  //   console.log('info', req.body);
  //   let init = new AiStats({
  //     "matchCount": 1,
  //     "winCount": 1,
  //     "moveAvg": 52
  //   })
  //   let savedStats = await init.save();
  //   res.status(200).json(savedStats);
    
  // } catch (err) {
  //   res.status(418).json({ message: err });
  // }
})

module.exports = router;