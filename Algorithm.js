
function getDirectiveSmart(before) {
  const bricks = before.filter(s => s > 0).length;
  // if (bricks >= 16 && before[0] >= 1024) {
  //   console.log("Almost full, let's find a way out!!!")
  // }

  const arrCommands = ['arrowup', 'arrowleft', 'arrowright']

  const arrEstimates = arrCommands.map(cmd => {
    const useSandBox = true; // (bricks < 14);

    const playGround = new GamePlate(before, useSandBox);
    playGround.doCommand(cmd);
    // If not progressed, will be opted out
    if (!playGround.progressed) {
      return {
        command: cmd,
        optedOut: true,
      };
    }

    const after = playGround.plate;
    const afterBricks = after.filter(s => s > 0).length;
    let score = estimate(playGround, cmd);

    // 2. give a punishments
    const firstLine = after.slice(0, 4);
    const secondLine = after.slice(4, 8);
    const thirdLine = after.slice(8, 12);
    const lastLine = after.slice(12, 16);

    // avoid 2 whole lines
    if (afterBricks == 7) {
      if (Math.min(...firstLine) > 0 && Math.min(...secondLine) == 0
        && Math.max(...thirdLine) == 0 && Math.max(...lastLine) == 0) {
        score -= 1000000;
      }
    }

    // avoid 3 whole lines
    if (afterBricks == 11) {
      if (Math.min(...firstLine) > 0 && Math.min(...secondLine) > 0
        && Math.min(...thirdLine) == 0 && Math.max(...lastLine) == 0) {
        score -= 1000000;
      }
    }

    // predict score and bricks
    const nextConditions = arrCommands.map(cmd => {
      const nextplayGround = new GamePlate(after, useSandBox);
      nextplayGround.doCommand(cmd);
      // as new bricks will come, the flag playGround.progressedis useless
      return estimate(nextplayGround, cmd);
    });

    // find the best candidate
    const bestPredict = Math.max(...nextConditions);

    return {
      command: cmd,
      score,
      bestPredict
    }
  }).filter(c => !c.optedOut);

  if (arrEstimates.length == 0) {
    return 'arrowdown';
  }

  let weight = 0.33;
  let bestCmd = MaxOf(arrEstimates, e => {
    const evalue = e.score + e.bestPredict * weight;
    // console.log(c.command, self, predict, evalue);
    return evalue;
  });
  // console.log(bestCmd.command, bestCmd.score, bestCmd.bestPredict.score);
  return bestCmd.command;
}



function estimate(playGround, cmd) {
  let score = 0;

  const stayWeights = [
    400, 300, 200, 150,
    20, 25, 50, 90,
    0, 0, 0, 0,
    0, 0, 0, 0
  ];

  // const mergeWeights = [
  //   1200, 550, 260, 125,
  //   15, 20, 25, 60,
  //   7, 3, 2, 2,
  //   2, 1, 1, 1
  // ];

  const mergeWeights = [
    25000, 12000, 10000, 8000,
    49, 80, 250, 1500,
    27, 9, 9, 2,
    1, 0, 0, 0
  ];

  const plate = playGround.plate;
  const news = playGround.news;
  const merges = plate.map((v, i) => {
    let mergeWeight = 0;
    if (i < 4 || i > 12 || (plate[i] <= plate[i - 4])) {
      mergeWeight += mergeWeights[i];
      if (news[i] == 'merge') {
        mergeWeight += 1 * mergeWeights[i];
      }
    }
    // if (i == 7 && plate[7] > plate[6]) {
    //   mergeWeight *= 2;
    // }
    return mergeWeight * plate[i];
  });

  score += merges.reduce((a, b) => a + b, 0);

  // 2. give a punishments

  const firstLine = plate.slice(0, 4);
  const secondLine = plate.slice(4, 8);
  const thirdLine = plate.slice(8, 12);
  const lastLine = plate.slice(12, 16);

  // for (let i = 0; i < 4; i++) {
  //   if (firstLine[i] < secondLine[i]) {
  //     score -= mergeWeights[i] * secondLine[i];
  //   }
  // }

  // for (let i = 0; i < 4; i++) {
  //   if (secondLine[i] < thirdLine[i]) {
  //     score -= 4000;
  //   }
  // }

  return score;
}

function goPath(path, before, score) {
  if (path.length > 10) {
    return { path, plate: before, score: score + 1000 };
  }
  const arrCommands = ['arrowup', 'arrowleft', 'arrowright', 'arrowdown'];
  const arrEstimates = arrCommands.map(cmd => {
    const playGround = new GamePlate(before);
    playGround.doCommand(cmd);
    // If not progressed, will be opted out
    if (!playGround.progressed) {
      return null;
    }
    return goPath([...path, cmd], playGround.plate, score + playGround.score);

  }).filter(c => !!c);

  if (arrEstimates.length == 0) {
    return { path, plate: before, score };
  }

  const maxPath = findMaxByCallback(arrEstimates, v => v.path.length);
  return maxPath;
}

function findMaxByCallback(arr, callback) {
  if (arr.length === 0) return undefined; // Handle empty array case

  const evalues = arr.map(v => callback(v));
  const max = Math.max(...evalues);
  const maxPosition = evalues.findIndex(v => v == max);
  return arr[maxPosition];
}


function MaxOf(arr, fn) {
  const map = arr.map(fn);
  const pos = map.indexOf(Math.max(...map));
  return arr[pos];
}
