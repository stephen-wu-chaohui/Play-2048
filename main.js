
const App = Vue.createApp({
  template: '#main-view',
  setup() {
    const { onMounted, onUnmounted, watch, reactive, ref } = Vue;

    const plate = LocalStoragePersist(new Array(16).fill(0), 'GamePlate.plate');
    const moves = reactive(new Array(plate.length).fill(0));
    const news = reactive(new Array(plate.length).fill(''));
    let steps = [];
    let stepIndex = 0;
    const gameOver = ref(false);
    const scores = LocalStoragePersist({
      score: 0,
      bestScore: 0
    }, 'GamePlate.scores');

    const settings = LocalStoragePersist({
      animation: 120,
      autoDrive: 600,
      replay: 100,
      hacking: 1000,
    }, 'GamePlate.settings');

    const speed = ref(0);
    const autoDriveSpeeds = [50, 200, 300, 500, 800, 1300, 2100]

    function setSpeed() {
      let setingAutoDrive = autoDriveSpeeds[speed.value];
      if (settings.autoDrive != setingAutoDrive) {
        settings.autoDrive = setingAutoDrive;
        if (runningModes.hiAutoDrive) {
          stopRunning();
          startAutoMode();
        }
      }
    }

    watch(scores, () => {
      scores.bestScore = Math.max(scores.bestScore, scores.score);
    }, { deep: true });

    const workingArea = new GamePlate(plate);

    const runningModes = reactive({ hiHack: null, hiAutoDrive: null })
    function startAutoMode() {
      if (runningModes.hiHack || runningModes.hiAutoDrive) {
        stopRunning();
        return;
      }

      speed.value = autoDriveSpeeds.findIndex(v => Math.abs(v - settings.autoDrive) <= 100);
      runningModes.hiAutoDrive = setInterval(() => {
        autoDrive();
      }, settings.autoDrive);
    }

    function startHackMode() {
      if (runningModes.hiHack || runningModes.hiAutoDrive) {
        stopRunning();
        return;
      }
      scores.bestScore = 0;
      return;
      runningModes.hiHack = setInterval(() => {
        hack();
      }, settings.hacking);
    }

    function stopRunning() {
      if (runningModes.hiAutoDrive) {
        clearInterval(runningModes.hiAutoDrive);
        runningModes.hiAutoDrive = null;
      }
      if (runningModes.hiHack) {
        clearInterval(runningModes.hiHack);
        runningModes.hiHack = null;
      }
    }

    function getDirective(sandbox) {
      return getDirectiveSmart(sandbox)
    }

    function getDirectiveDummy(sandbox) {
      const dir = Math.round(Math.random() * 3);
      const arrCommands = ['arrowup', 'arrowleft', 'arrowright', 'arrowdown']
      return arrCommands[dir];
    }

    function getDirectiveSmart(before) {
      const bricks = before.filter(s => s > 0).length;
      if (bricks >= 16 && before[0] >= 1024) {
        // const { path, plate, score } = goPath([], before, 0);
        // if (path.length > 0) {
        //   return path[0];
        // }
        console.log("Almost full, let's find a way out!!!")
      }

      const arrCommands = ['arrowup', 'arrowleft', 'arrowright']

      const useSandBox = (bricks < 14);

      const arrEstimates = arrCommands.map(cmd => {
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
        let score = estimate(playGround, cmd);

        // 2. give a punishments
        const firstLine = after.slice(0, 4);
        const secondLine = after.slice(4, 8);
        const thirdLine = after.slice(8, 12);
        const lastLine = after.slice(12, 16);

        const afterBricks = after.filter(s => s > 0).length;
        // avoid 3 whole lines
        if (afterBricks == 11) {
          if (Math.min(...firstLine) > 0 && Math.min(...secondLine) > 0
            && Math.min(...thirdLine) == 0 && Math.max(...lastLine) == 0) {
            score -= 1000;
          }
        }

        // avoid 2 whole lines if first block is too large
        if (afterBricks == 7 && after[0] >= 512) {
          if (Math.min(...firstLine) > 0 && Math.min(...secondLine) == 0
            && Math.max(...thirdLine) == 0 && Math.max(...lastLine) == 0) {
            score -= 1000;
          }
        }

        // predict score and bricks
        const nextConditions = arrCommands.map(cmd => {
          const nextplayGround = new GamePlate(after, useSandBox);
          nextplayGround.doCommand(cmd);
          // as new bricks will come, the flag playGround.progressedis useless
          const score = estimate(nextplayGround, cmd);
          return {
            score,
            bricks: 0 // nextplayGround.plate.filter(p => !p).length
          };
        });

        // find the best candidate
        const bestPredict = MaxOf(nextConditions, c => c.score - c.bricks * 8 + 100);

        return {
          command: cmd,
          score,
          bricks,
          bestPredict
        }
      }).filter(c => !c.optedOut);

      if (arrEstimates.length == 0) {
        return 'arrowdown';
      }

      let weight = 1.3; // bricks / 8 + 2;
      let bestCmd = MaxOf(arrEstimates, c => {
        const self = c.score;// + c.bricks * 8;
        const predict = c.bestPredict.score;// - c.bestPredict.bricks * 8;
        const evalue = self * weight + predict;
        console.log(c.command, self, predict, evalue);
        return evalue;
      });
      console.log(bestCmd.command, bestCmd.score, bestCmd.bestPredict.score);
      return bestCmd.command;
    }

    function estimate(playGround, cmd) {
      const after = playGround.plate;
      const bigestBlock = Math.max(...after);
      const news = playGround.news;
      const merges = after.map((v, i) => news[i] == 'merge' ? v : 0);

      let score = merges.slice(0, 4).reduce((a, b) => a + b, 0) * 1.5
        + merges.slice(4, 8).reduce((a, b) => a + b, 0)
        + merges.slice(8, 12).reduce((a, b) => a + b, 0)
        + merges.slice(12, 16).reduce((a, b) => a + b, 0) * 0.1;

      // score = merges.reduce((prev, v, idx) => {
      //   let s = v * (4 - Math.floor(idx / 4)) * (4 - Math.floor(idx % 4))
      //   return prev + s;
      // }, 0);

      // Adjust score for special conditions:
      // 1. give a big bonus if playGround.plate[0] is the bigest
      if (after[0] == bigestBlock) {
        score += 4000;
      }

      if (cmd == 'arrowup') {
        if (after[0] != 0 && after[0] != bigestBlock) {
          score -= 1000;
        }
        if (after[3] >= 128 && after[7] == after[3]) {
          score += 1000;
        }
      }

      // if (cmd == 'arrowleft') {
      //   if (after[3] >= 128 && after[6] == after[3] / 2 && after[7] == 0) {
      //     score -= 1000;
      //   }
      // }

      // 2. give a punishments
      const firstLine = after.slice(0, 4);
      const secondLine = after.slice(4, 8);
      const thirdLine = after.slice(8, 12);
      const lastLine = after.slice(12, 16);

      for (let i = 0; i < 4; i++) {
        if (firstLine[i] < secondLine[i]) {
          score -= 1000;
        }
      }

      if (firstLine[2] == 256) {
        if (secondLine[2] == 128 || secondLine[2] == 256)
          score += 900;
      }

      // 2. give a punishments
      // const firstLine = after.slice(0, 4);
      // const secondLine = after.slice(4, 8);
      // if (after[0] < after[1] || after[0] < after[4]) {
      //   score -= 1000;
      // }
      // if (after[2] < after[3] || after[2] < after[5]) {
      //   score -= 1000;
      // }
      // if (after[4] < after[5] || after[4] < after[8]) {
      //   score -= 1000;
      // }
      // if (after[5] < after[6] || after[5] < after[9]) {
      //   score -= 1000;
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

      return arr.reduce((maxData, currentElement) =>
        ((currentValue) => currentValue > maxData.maxValue ? { element: currentElement, maxValue: currentValue } : maxData)(callback(currentElement)),
        { element: arr[0], maxValue: callback(arr[0]) }
      ).element;
    }



    function getDirectiveSmarter(sandbox) {
      const best = sandbox.sort()
      let score = 0
      for (let i = 0; i < 16; i++) {
        score += best.indexOf(sandbox[i])
      }
    }

    function newGame() {
      scores.score = 0;
      workingArea.newGame();
      gameOver.value = workingArea.gameOver();
      react();
    }

    function autoDrive() {
      // if (Math.max(...plate) >= 1024 && Math.min(...plate) > 0) {
      //   stopRunning();
      //   return;
      // }
      const cmd = getDirective([...plate]);
      if (!cmd) {
        gameOver.value = true;
      } else {
        doCommand({ code: cmd });
        react();
      }
    }

    async function replayGame(score) {
      if (runningModes.isReplaying) {
        runningModes.isReplaying = false;
        return;
      }
      if (!steps || steps.length == 0) {
        const gameRecorder = workingArea.gameRecorder;
        gameRecorder.restore(score);
        steps = gameRecorder.currentRecord.steps;
        console.log({ steps })
        stepIndex = 0;
        stopRunning();
        workingArea.clearForReplay();
        scores.score = 0;
        gameOver.value = false; // workingArea.gameOver();
      }
      runningModes.isReplaying = true;
      if (steps) {
        for (const step of steps) {
          if (runningModes.isReplaying) {
            runningModes.currentCommand = workingArea.replayStep(step);
            await react();
            await delay(settings.autoDrive - 2 * settings.animation);
          }
        }
      }
      runningModes.isReplaying = false;
      steps = [];
    }

    function hack() {
      newGame();
      // plate.forEach((v, p, d) => { d[p] *= 2 })
      let count = 0;
      while (!gameOver.value) {
        const cmd = getDirective([...plate]);
        doCommand({ code: cmd });
        count++;
        gameOver.value = workingArea.gameOver();
        plate.splice(0, plate.length, ...workingArea.plate);
      }
      whenGameOver();
      console.log({ count, score: scores.score })
      react();
    }

    function delay(time) {
      return new Promise(resolve => setTimeout(resolve, time));
    }

    function MaxOf(arr, fn) {
      const map = arr.map(fn);
      const pos = map.indexOf(Math.max(...map));
      return arr[pos];
    }

    async function react() {
      gameOver.value = workingArea.gameOver();
      if (!runningModes.hiHack) {
        // Update moving steps so that block can move
        // console.log({ plate: [...workingArea.plate], moves: [...workingArea.moves] })
        moves.splice(0, moves.length, ...workingArea.moves);
        await delay(settings.animation - 20);
      }
      // Stop all moving animation and update the plate, scores and news animation
      moves.forEach((v, p, a) => a[p] = 0);
      plate.splice(0, plate.length, ...workingArea.plate);
      news.splice(0, plate.length, ...workingArea.news);
      scores.score += workingArea.score;
      workingArea.score = 0;
      if (!runningModes.hiHack) {
        await delay(settings.animation);
      }
      // stop all merge and new animation
      news.forEach((v, p, a) => a[p] = '');
    }

    function whenGameOver() {
      if (gameOver.value) {
        if (scores.score >= scores.bestScore) {
          workingArea.gameRecorder.saveRecord(scores.score);
        }
        if (runningModes.hiAutoDrive) {
          clearInterval(runningModes.hiAutoDrive);
          runningModes.hiAutoDrive = null;
        }
      }
    }

    watch(gameOver, whenGameOver)

    onMounted(() => {
      document.addEventListener('keydown', doCommand);
      document.addEventListener('swiped', e => {
        // runningModes.currentCommand = e.type;
        console.log(e)
        doCommand({ code: 'arrow' + e.detail.dir });
      });
      document.addEventListener('touchstart', e => {
        // runningModes.currentCommand = e.type;
        console.log(e)
      });
      document.addEventListener('touchmove', e => {
        // runningModes.currentCommand = e.type;
        // console.log(e)
      });
    });

    onUnmounted(() => {
      document.removeEventListener('keydown', doCommand);
      document.removeEventListener('swiped', doCommand);
    });


    function doCommand(e) {
      // console.log(e.code);
      if (!e || !e.code) {
        return;
      }
      let cmd = e.code.toLowerCase();
      runningModes.currentCommand = cmd;
      // if (autoDriving){return}
      const step = workingArea.doCommand(cmd);
      react();
    }

    function animationStyles(v, pos) {
      if (!v) return {};

      return {
        'animation-name': news[pos] || (moves[pos] > 0 ? runningModes.currentCommand : ''),
        'z-index': 10,
        'animation-duration': settings.animation + 'ms',
        'animation-timing-function': 'ease-in-out'
      }
    }

    function tok(n) {
      if (n > 1000)
        return `${Math.floor(n / 1000)}K`
      return n;
    }

    return {
      plate, news, moves, gameOver, scores, workingArea, runningModes, speed,
      newGame, startAutoMode, animationStyles, startHackMode, replayGame, setSpeed, tok
    }
  }
});

const vm = App.mount('#app');
