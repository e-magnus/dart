const { handleNumberInput, submitRound } = require('../handlers.js');

describe('Game rules - invalid double finish bust', () => {
  beforeEach(() => {
    global.currentDarts = [];

    global.getCurrentDartCount = jest.fn(() => 1);
    global.getCurrentMultiplier = jest.fn(() => 1);
    global.addDartToRound = jest.fn();
    global.getCurrentRoundScore = jest.fn(() => 40);
    global.getActivePlayer = jest.fn(() => ({ score: 40 }));
    global.getActivePlayerIndex = jest.fn(() => 0);
    global.getWebSocket = jest.fn(() => null);

    global.sendBustToServer = jest.fn();
    global.resetCurrentRound = jest.fn();
    global.showBustModal = jest.fn();
    global.showToast = jest.fn();
  });

  test('shows bust modal with double/bull reason and no toast', () => {
    const result = handleNumberInput(20);

    expect(result).toBe(false);
    expect(global.showBustModal).toHaveBeenCalledWith(40, 40, 'Þú verð að enda með tvöfaldan eða bull (25/50)!');
    expect(global.showToast).not.toHaveBeenCalled();
  });
});

describe('Game rules - bust on score 1', () => {
  beforeEach(() => {
    global.currentDarts = [{ value: 20, multiplier: 1 }];

    global.getCurrentDartCount = jest.fn(() => 3);
    global.getCurrentRoundScore = jest.fn(() => 31);
    global.getActivePlayerIndex = jest.fn(() => 0);
    global.getActivePlayer = jest.fn(() => ({ score: 32 }));
    global.getWebSocket = jest.fn(() => null);

    global.sendBustToServer = jest.fn();
    global.resetCurrentRound = jest.fn();
    global.showBustModal = jest.fn();
  });

  test('shows bust modal with remaining score', () => {
    const result = submitRound();

    expect(result).toBe(false);
    expect(global.showBustModal).toHaveBeenCalledWith(32, 31);
  });
});
