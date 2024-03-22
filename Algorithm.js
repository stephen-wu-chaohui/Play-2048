const AlgorithmRecorder = [];

function clearAlgorithmRecorder() {
  AlgorithmRecorder.length = 0;
}

function dumpAlgorithmRecorder() {
  console.log(AlgorithmRecorder);
}

function getDirectiveSmart(before) {
  const bricks = before.filter(s => s > 0).length;
  let useSandBox = true; // (bricks < 14);

  const arrCommands = ['arrowup', 'arrowleft', 'arrowright']

  const alIndex = AlgorithmRecorder.push({
    before: JSON.parse(JSON.stringify(before))
  }) - 1;

  const alRec = AlgorithmRecorder[alIndex];
  alRec.index = alIndex;

  const arrEstimates = arrCommands.map(cmd => {
    alRec[cmd] = {};
    const playGround = new GamePlate(before, useSandBox);
    playGround.doCommand(cmd);
    // If not progressed, will be opted out
    if (!playGround.progressed) {
      alRec[cmd].optedOut = 'not progressed';
      return {
        command: cmd,
        optedOut: true,
      };
    }

    const after = playGround.plate;
    alRec[cmd].after = JSON.parse(JSON.stringify(after));
    const afterBricks = after.filter(s => s > 0).length;
    let score = estimate(playGround, cmd);

    score += after.map((v, i) => {
      let s = 0;
      let r = ranks.findIndex(rv => rv == v)
      if (i < 8) {
        // let next = (i < 3) ? i + 1 : (i == 4) ? 7 : i - 1;
        let r1 = ranks.findIndex(rv => rv == after[i + 4])
        // let r2 = ranks.findIndex(rv => rv == plate[next])

        if (r >= r1 || i == 3) {
          s += r * stayWeights[i];
        }
      }
      return s;
    }).reduce((a, b) => a + b, 0);


    alRec[cmd].estimate = score;

    // 2. give a punishments
    const firstLine0 = before.slice(0, 4);
    const secondLine0 = before.slice(4, 8);
    const thirdLine0 = before.slice(8, 12);
    const lastLine0 = before.slice(12, 16);

    const firstLine = after.slice(0, 4);
    const secondLine = after.slice(4, 8);
    const thirdLine = after.slice(8, 12);
    const lastLine = after.slice(12, 16);

    Array.prototype.startWith = function (b) { return this.every((v, i) => i > b.length || v == b[i]) }
    Array.prototype.equal = function (b) { return this.every((v, i) => v == b[i]); }
    Array.prototype.endWith = function (b) { return this.slice().reverse().startWith(b.slice().reverse()); }

    if (firstLine.equal(firstLine0) && Math.max(...firstLine) == firstLine[0] && Math.min(...firstLine) > 0) {
      if (firstLine[2] >= 64 && secondLine[2] == firstLine[2] || secondLine[3] == firstLine[3]) {
        score += 0;
      }
      else if (firstLine[3] >= 4 && firstLine[2] >= 64 && secondLine0[3] >= 32 && secondLine[3] == 0 && cmd == 'arrowleft') {
        score -= 7 * 2 * 80000;
      }
    }

    if (firstLine.equal(firstLine0) && secondLine.equal(secondLine0) && thirdLine.equal(thirdLine0)) {
      if (thirdLine.startWith([8, 16])) {
        const lastPaterns = [[8], [4, 4], [4, 2, 2]];
        if (lastPaterns.some(p => lastLine.startWith(p)) && cmd == 'arrowright') {
          score -= 1000;
        }
      } else if (thirdLine.endWith([16, 8])) {
        const lastPaterns = [[8], [4, 4], [2, 2, 4]];
        if (lastPaterns.some(p => lastLine.endWith(p)) && cmd == 'arrowleft') {
          score -= 1000;
        }
      } else if (thirdLine.startWith([16, 32])) {
        const lastPaterns = [[8], [4, 4], [4, 2, 2]];
        if (lastPaterns.some(p => lastLine.startWith(p)) && cmd == 'arrowright') {
          score -= 1000;
        }
      } else if (thirdLine.endWith([16])) {
        const lastPaterns = [[8], [4, 4], [2, 2, 4]];
        if (lastPaterns.some(p => lastLine.endWith(p)) && cmd == 'arrowleft') {
          score -= 1000;
        }
      }
    }

    // // avoid 2 whole lines
    // if (afterBricks == 7) {
    //   if (Math.min(...firstLine) > 0 && Math.min(...secondLine) == 0
    //     && Math.max(...thirdLine) == 0 && Math.max(...lastLine) == 0) {
    //     score -= 1000000;
    //     alRec[cmd].avoid2wholelines = score;
    //   }
    // }

    // avoid 3 whole lines
    if (afterBricks == 11) {
      if (Math.min(...firstLine) > 0 && Math.min(...secondLine) > 0
        && Math.min(...thirdLine) == 0 && Math.max(...lastLine) == 0) {
        // score = 0;
        score *= -1;
        alRec[cmd].avoid3wholelines = score;
      }
    }

    alRec[cmd].predict = {};
    const predict = alRec[cmd].predict;
    // predict score and bricks
    const nextConditions = arrCommands.map(cmd => {
      const nextplayGround = new GamePlate(after, useSandBox);
      nextplayGround.doCommand(cmd);
      // as new bricks will come, the flag playGround.progressedis useless
      const estimated = estimate(nextplayGround, cmd);
      predict[cmd] = estimated;
      return estimated;
    });

    // find the best candidate
    const bestPredict = Math.max(...nextConditions);

    alRec[cmd].bestPredict = bestPredict;

    return {
      command: cmd,
      score,
      bestPredict
    }
  }).filter(c => !c.optedOut);

  if (arrEstimates.length == 0) {
    alRec['arrowdown'] = 'arrEstimates.length == 0';
    return 'arrowdown';
  }

  let weight = 0.2;
  let bestCmd = MaxOf(arrEstimates, e => {
    const evalue = e.score + e.bestPredict * weight;
    // console.log(c.command, self, predict, evalue);
    alRec[e.command].evalue = {
      score: e.score,
      bestPredict: e.bestPredict,
      weight,
      evalue
    };
    return evalue;
  });
  // console.log(bestCmd.command, bestCmd.score, bestCmd.bestPredict.score);

  alRec[bestCmd.command].chosen = 'Highest';
  return bestCmd.command;
}

const stayWeights = [
  90000, 35000, 15000, 7000,
  390, 800, 1900, 4000,
  190, 90, 40, 18,
  1, 1, 1, 1
];

const ranks = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536];

function estimate(playGround, cmd) {
  let score = 0;

  const mergeWeights = stayWeights;
  // [
  //   40000, 3000, 2000, 3000,
  //   110, 250, 400, 900,
  //   50, 20, 10, 4,
  //   0, 0, 0, 0
  // ];

  const plate = playGround.plate;
  const news = playGround.news;

  score += plate.map((v, i) => {
    let s = 0;
    let r = ranks.findIndex(rv => rv == v)
    if (news[i] == 'merge') {
      let p = (i < 5 && r < 3) ? 5 : r;
      p = r;
      s += p * mergeWeights[i];
    }
    return s;
  }).reduce((a, b) => a + b, 0);



  // 2. give a punishments

  const firstLine = plate.slice(0, 4);
  const secondLine = plate.slice(4, 8);
  const thirdLine = plate.slice(8, 12);
  const lastLine = plate.slice(12, 16);

  // if (Math.min(...firstLine) == firstLine[3] && firstLine[3] >= 64
  //   && Math.max(...secondLine) == secondLine[3] && (secondLine[3] * 2) == firstLine[3]) {
  //   score += 4000000;
  // }
  // for (let i = 4; i < 8; i++) {
  //   if (plate[i] < plate[i - 4]) {
  //     score -= mergeWeights[i] * plate[i];
  //   }
  // }

  // for (let i = 0; i < 4; i++) {
  //   if (secondLine[i] < thirdLine[i]) {
  //     score -= 4000;
  //   }
  // }

  return score;
}

function MaxOf(arr, fn) {
  const map = arr.map(fn);
  const pos = map.indexOf(Math.max(...map));
  return arr[pos];
}
