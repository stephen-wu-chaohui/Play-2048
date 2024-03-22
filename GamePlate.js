
class GamePlate {

  progressed = false;
  score = 0;
  plate = [];   // Current points for each position or new points for each osition after do command
  moves = [];   // moving moves for each position after do command
  news = [];    // new events (new or merge) for each position after do command
  sandboxMode = false;
  gameRecorder = new GameRecorder();

  constructor(init, sandbox) {
    this.sandboxMode = !!sandbox;
    this.plate = [...init];
    this.moves = new Array(this.plate.length).fill(0);
    this.news = new Array(this.plate.length).fill('');
  }

  hack() {
    this.plate.forEach((i) => { i.points *= 2 })
  }

  newGame() {
    this.gameRecorder.startRecord();
    this.plate.forEach((v, pos, arr) => arr[pos] = 0);
    this.moves.forEach((v, pos, arr) => arr[pos] = 0);
    this.news.forEach((v, pos, arr) => arr[pos] = 0);
    const init1 = this.increase();
    this.gameRecorder.recordStep({ newPos: init1, newv4: this.plate[init1] == 4 })
    const init2 = this.increase();
    this.gameRecorder.recordStep({ newPos: init2, newv4: this.plate[init2] == 4 })
    this.score = 0;
  }

  doCommand(cmd) {
    if (this[cmd]) {
      this.moves.forEach((v, pos, arr) => arr[pos] = 0);
      this.news.forEach((v, pos, arr) => arr[pos] = 0);
      this.progressed = 0;
      this[cmd]();
      if (this.progressed) {
        const newPos = this.increase();
        if (newPos >= 0) {
          this.gameRecorder.recordStep({ command: cmd, newPos, newv4: this.plate[newPos] == 4 });
        }
      }
    }
  }

  clearForReplay() {
    this.gameRecorder.startReplay();
    this.plate.forEach((v, pos, arr) => arr[pos] = 0);
    this.moves.forEach((v, pos, arr) => arr[pos] = 0);
    this.news.forEach((v, pos, arr) => arr[pos] = 0);
    this.score = 0;
  }

  replayStep(step) {
    const cmd = step.command;
    if (this[cmd]) {
      this.moves.forEach((v, pos, arr) => arr[pos] = 0);
      this.news.forEach((v, pos, arr) => arr[pos] = 0);
      this.progressed = 0;
      this[cmd]();
      // this.moves.forEach((v, pos, arr) => arr[pos] = 0);
    }
    this.plate[step.newPos] = step.newv4 ? 4 : 2;
    this.news[step.newPos] = 'new';
    return cmd;
  }

  gameOver() {
    const _isMergable = (square) => {
      for (let r = 0; r < 4; r++) {
        const row = square.slice(r * 4, r * 4 + 4);
        if (row[0] == row[1] || row[1] == row[2] || row[2] == row[3])
          return true;
      }
      return false;
    }

    if (this.plate.some(v => !v))
      return false;

    if (_isMergable(this.plate))
      return false;

    const square = this.plate.map((v, p, a) => {
      const i = 3 - p % 4, j = Math.floor(p / 4);
      return a[i * 4 + j]
    });
    if (_isMergable(square))
      return false;

    return true;
  }

  increase() {
    if (this.sandboxMode) {
      return -1;
    }
    const emptyPositions = this.plate.map((points, pos) => ({ points, pos })).filter(d => d.pos > 0 && d.points == 0).map(d => d.pos);
    if (emptyPositions.length > 0) {
      const randomPosition = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
      const possiblity = Math.random();

      this.plate[randomPosition] = possiblity > 0.9 ? 4 : 2;
      this.news[randomPosition] = 'new';
      return randomPosition;
    }
    return -1;
  }

  arrowleft() {
    const square = this.plate.map((v, p, a) => ({
      points: v,
      moves: 0,
      news: ''
    }));
    this.roll(square);
    if (!this.progressed) {
      return;
    }
    const result = square.map((v, p, a) => {
      const i = Math.floor(p / 4), j = p % 4;
      return a[i * 4 + j]
    });
    this.plate.splice(0, this.plate.length, ...result.map(r => r.points));
    this.moves.splice(0, this.moves.length, ...result.map(r => r.moves));
    this.news.splice(0, this.news.length, ...result.map(r => r.news));
  }

  arrowright() {
    const square = this.plate.map((v, p, a) => {
      const i = Math.floor(p / 4), j = 3 - p % 4;
      return {
        points: a[i * 4 + j],
        moves: 0,
        news: ''
      }
    });
    this.roll(square);
    if (!this.progressed) {
      return;
    }
    const result = square.map((v, p, a) => {
      const i = Math.floor(p / 4), j = 3 - p % 4;
      return a[i * 4 + j]
    });
    this.plate.splice(0, this.plate.length, ...result.map(r => r.points));
    this.moves.splice(0, this.moves.length, ...result.map(r => r.moves));
    this.news.splice(0, this.news.length, ...result.map(r => r.news));
  }

  arrowdown() {
    const square = this.plate.map((v, p, a) => {
      const i = 3 - p % 4, j = Math.floor(p / 4);
      return {
        points: a[i * 4 + j],
        moves: 0,
        news: ''
      }
    });
    this.roll(square);
    if (!this.progressed) {
      return;
    }
    const result = square.map((v, p, a) => {
      const i = p % 4, j = 3 - Math.floor(p / 4);
      return a[i * 4 + j]
    });
    this.plate.splice(0, this.plate.length, ...result.map(r => r.points));
    this.moves.splice(0, this.moves.length, ...result.map(r => r.moves));
    this.news.splice(0, this.news.length, ...result.map(r => r.news));
  }

  arrowup() {
    const square = this.plate.map((v, p, a) => {
      const i = p % 4, j = 3 - Math.floor(p / 4);
      return {
        points: a[i * 4 + j],
        moves: 0,
        news: ''
      }
    });
    this.roll(square);
    if (!this.progressed) {
      return;
    }
    const result = square.map((v, p, a) => {
      const i = 3 - p % 4, j = Math.floor(p / 4);
      return a[i * 4 + j]
    });
    this.plate.splice(0, this.plate.length, ...result.map(r => r.points));
    this.moves.splice(0, this.moves.length, ...result.map(r => r.moves));
    this.news.splice(0, this.news.length, ...result.map(r => r.news));
  }

  roll(square) {
    this.progressed = false;

    for (let r = 0; r < 4; r++) {
      const row = square.slice(r * 4, r * 4 + 4);
      this.rollRow(row);
      square.splice(r * 4, 4, ...row);
    }
  }

  rollRow(row) {
    const length = row.length;
    for (let cursor = 0; cursor < length - 1; cursor++) {
      let moved = false;
      let pos1 = row.findIndex((v, idx) => idx >= cursor && v.points > 0);
      if (pos1 != -1 && pos1 != cursor) {
        row[pos1].moves = pos1 - cursor;
        row[cursor].points = row[pos1].points;
        row[pos1].points = 0;
        moved = true;
      }
      if (row[cursor].points == 0) {
        break;
      }

      if (cursor < length - 2) {
        const next = cursor + 1;
        let pos2 = row.findIndex((v, idx) => idx >= next && v.points > 0);
        if (pos2 != -1 && pos2 != next) {
          row[pos2].moves = pos2 - next;
          row[next].points = row[pos2].points;
          row[pos2].points = 0;
          moved = true;
        }
        if (pos2 == -1) {
          pos2 = next;
        }
      }

      if (row[cursor].points === row[cursor + 1].points) {
        row[cursor].points *= 2;
        row[cursor].news = 'merge';
        this.score += row[cursor].points;
        row[cursor + 1].points = 0;
        moved = true;
      }
      if (moved) {
        this.progressed = true;
      }
    }
  }

  rollRow2(rowCopy) {
    const rowPoints = rowCopy.map(r => r.points);
    row.splice(0, row.length, ...rowPoints);

    moveLeft();
    const result = row.map((p, i) => ({
      points: p,
      moves: trueRowMove[i],
      news: ''
    }));
    rowCopy.splice(0, rowCopy.length, ...result)
    if (trueRowMove.some(v => v > 0)) {
      this.progressed = true;
    }
    this.score += score;
  }
}
