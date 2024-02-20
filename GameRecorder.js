class GameRecorder {
  currentRecord = {}
  isReplaying = false;

  startRecord(mode) {
    this.currentRecord = new Object();
    this.currentRecord.mode = mode;
    this.currentRecord.timestamp = new Date();
    this.currentRecord.procedure = '';
    this.isReplaying = false;
  }

  startReplay() {
    this.isReplaying = true;
  }

  recordStep(step) {
    if (!this.isReplaying && step) {
      let hex = this._stepHex(step);
      this.currentRecord.procedure += hex;
    }
  }

  saveRecord(score) {
    if (this.isReplaying) {
      return;
    }
    const itemName = `R-best`;
    this.currentRecord.score = score;
    localStorage.setItem(itemName, JSON.stringify(this.currentRecord));
  }

  restore(score) {
    const itemName = `R-${score}`;
    const savedValue = localStorage.getItem(itemName);
    this.currentRecord = {}
    try {
      const savedSettings = JSON.parse(savedValue);
      if (savedSettings) {
        this.currentRecord = savedSettings;
        this.currentRecord.replay = true;
        this.currentRecord.steps = this._procedureSteps(this.currentRecord.procedure);
        this.isReplaying = true;
      }
    } catch (e) {
      console.log(e, { savedValue });
    }
  }

  constructor(init) {
  }


  _arrCommands = ['arrowleft', 'arrowup', 'arrowright', 'arrowdown'];

  _stepHex(step) {
    const command = step.command ? this._arrCommands.indexOf(step.command) : 4;
    const bits = step.newPos | (step.newv4 << 4) | command << 5;
    const byteToHex = (byte) => {
      // Convert the byte to a hexadecimal string
      let hex = byte.toString(16);

      // Pad with zero if necessary to ensure it's 2 digits
      if (hex.length < 2) {
        hex = '0' + hex;
      }
      return hex;
    };
    return byteToHex(bits);
  }

  _hexStep(hexString) {
    const bits = parseInt(hexString, 16);
    const step = {};
    const command = (bits >> 5) & 0x1F;
    if (command != 4) {
      step.command = this._arrCommands[command];
    }
    step.newv4 = ((bits >> 4) & 0x1);
    step.newPos = (bits & 0x0F);

    return step;
  }

  _procedureSteps(hexString) {
    const steps = [];
    while (hexString.length > 0) {
      let firstTwoChars = hexString.substring(0, 2);
      steps.push(this._hexStep(firstTwoChars));
      hexString = hexString.slice(2);
    }
    return steps;
  }

  _mapHex(rec) {
    const command = rec.command ? this._arrCommands.indexOf(rec.command) : 4;
    const bits = rec.newPos | (rec.newv4 << 4) | command << 5;
    return bits.toString(16);
  }


}
