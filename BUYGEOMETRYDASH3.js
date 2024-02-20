let rowMove = [0, 0, 0, 0]
let oldRow = [0, 0, 0, 0] // used
let row = [2, 4, 8, 4] // used
const trueRowMove = [0, 0, 0, 0];
let score = 0;


function moveLeft() {

  function countNumber() {
    let numberCount = 0
    for (let i = 0; i < 4; i++) {
      numberCount += row[i] > 0
    }
    return numberCount;
  }

  oldRow = []
  score = 0;
  for (i = 0; i < 4; i++) {
    oldRow[i] = row[i];
  }
  let numberCount = countNumber()

  switch (numberCount) {
    case 4:
      merge(0, 1)
      merge(1, 2)
      merge(2, 3)
      break;
    case 3:
      if (!row[3]) {
        merge(0, 1)
        merge(1, 2)
      } else if (!row[1]) {
        merge(0, 2)
        merge(2, 3)
      } else if (!row[0]) {
        merge(1, 2)
        merge(2, 3)
      } else if (!row[2]) {
        merge(0, 1)
        merge(1, 3)
      }
      break;
    case 2:
      merge(0, 1)
      merge(0, 2)
      merge(0, 3)
      merge(1, 2)
      merge(1, 3)
      merge(2, 3)
      break;
    case 1:
      break;
    default:
      break;
  }

  squish(trueRowMove)
}

function merge(a, b) { // possible bug here, may need to update didAnything
  if (row[a] > 0 && row[b] > 0 && row[a] == row[b]) {
    row[a] *= 2;
    row[b] = 0;
    rowMove[b] = a;
    score += row[a];
  }
}

function squish(trueRowMove) {
  amountMovedBySquish = []
  let offset = 0
  for (let i = 0; i < 4; i++) {
    if (row[i] == 0) {
      offset++
    }
    amountMovedBySquish.push(offset)
  }
  for (let i = 0; i < 4; i++) {
    if (rowMove[i] == 0) {
      rowMove[i] = i
    }
  }
  for (let i = 0; i < 4; i++) {
    trueRowMove[i] = i - rowMove[i]
  }
  for (let i = 0; i < 4; i++) {
    if (oldRow[i] != 0) {
      trueRowMove[i] = amountMovedBySquish[i]
    }
  }
  row = row.filter(function (val) {
    return val != 0;
  });
  while (row.length < 4) {
    row.push(0)
  }
}
