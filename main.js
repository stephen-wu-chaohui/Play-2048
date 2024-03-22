
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
    const autoDriveSpeeds = [20, 150, 300, 900, 1800, 3000, 5000]

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
      }
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
      clearAlgorithmRecorder();
      gameOver.value = workingArea.gameOver();
      react();
    }

    function autoDrive() {
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
      dumpAlgorithmRecorder();
      if (steps) {
        for (const step of steps) {
          if (runningModes.isReplaying) {
            runningModes.currentCommand = workingArea.replayStep(step);
            react();
            await delay(settings.autoDrive);
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
        doCommand({ code: 'arrow' + e.detail.dir });
      });
      window.scrollTo(1, 0);
    });

    onUnmounted(() => {
      document.removeEventListener('keydown', doCommand);
      document.removeEventListener('swiped', doCommand);
    });


    function doCommand(e) {
      if (!e || !e.code) {
        return;
      }
      let cmd = e.code.toLowerCase();
      runningModes.currentCommand = cmd;
      workingArea.doCommand(cmd);
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
