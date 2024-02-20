var autoDriving = false
function autoDrive(workingArea, generations) {
  autoDriving = true
  function evaluate(sandbox) {
    for (let i = 0; i < generations; i++) {
      //
    }
    return Math.round(Math.random() * 3)
  }

  const output = evaluate(workingArea)
  switch (output) {
    case 0:
      workingArea.doCommand('arrowleft')
      break;

    case 1:
      workingArea.doCommand('arrowright')
      break;

    case 2:
      workingArea.doCommand('arrowdown')
      break;

    case 3:
      workingArea.doCommand('arrowup') // shouldn't ahppen a lot
      break;

    default:
      break;
  }

}