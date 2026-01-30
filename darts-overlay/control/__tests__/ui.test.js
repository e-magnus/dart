/** @jest-environment jsdom */

const { showBustModal, showToast, showLegWinModal, hideLegWinModal } = require('../ui.js');

describe('UI flow - bust modal', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="bustModal" class="modal">
        <div id="bustPlayerName"></div>
        <div id="bustMessage"></div>
      </div>
    `;

    global.getActivePlayer = () => ({ name: 'Leikmaður 1' });
  });

  test('shows reason message when provided', () => {
    showBustModal(50, 50, 'Þú verð að enda með tvöfaldan eða bull (25/50)!');

    expect(document.getElementById('bustPlayerName').textContent).toBe('Leikmaður 1');
    expect(document.getElementById('bustMessage').textContent).toBe(
      'Þú verð að enda með tvöfaldan eða bull (25/50)!'
    );
    expect(document.getElementById('bustModal').classList.contains('show')).toBe(true);
  });

  test('shows remaining score when no reason provided', () => {
    showBustModal(32, 40);

    expect(document.getElementById('bustMessage').textContent).toBe(String(32 - 40));
    expect(document.getElementById('bustModal').classList.contains('show')).toBe(true);
  });
});

describe('UI flow - toast timing', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    document.body.innerHTML = `
      <div id="toast" class="toast"></div>
      <div id="win-animation" class="win-animation"></div>
      <div id="leg-win-animation" class="leg-win-animation"></div>
    `;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('shows immediately when no animation active', () => {
    showToast('Test');
    expect(document.getElementById('toast').classList.contains('show')).toBe(true);
  });

  test('delays toast until win animation finishes', () => {
    document.getElementById('win-animation').classList.add('active');

    showToast('Win');
    expect(document.getElementById('toast').classList.contains('show')).toBe(false);

    jest.advanceTimersByTime(5199);
    expect(document.getElementById('toast').classList.contains('show')).toBe(false);

    jest.advanceTimersByTime(1);
    expect(document.getElementById('toast').classList.contains('show')).toBe(true);
  });

  test('delays toast until leg animation finishes', () => {
    document.getElementById('leg-win-animation').classList.add('active');

    showToast('Leg');
    expect(document.getElementById('toast').classList.contains('show')).toBe(false);

    jest.advanceTimersByTime(6199);
    expect(document.getElementById('toast').classList.contains('show')).toBe(false);

    jest.advanceTimersByTime(1);
    expect(document.getElementById('toast').classList.contains('show')).toBe(true);
  });
});

describe('UI flow - leg win modal timing', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    document.body.innerHTML = `
      <div id="legWinModal" class="modal"></div>
      <div id="legWinText"></div>
    `;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('auto-hides after 3s when not game win', () => {
    showLegWinModal('Leg won', false, 0);
    expect(document.getElementById('legWinModal').classList.contains('show')).toBe(true);

    jest.advanceTimersByTime(2999);
    expect(document.getElementById('legWinModal').classList.contains('show')).toBe(true);

    jest.advanceTimersByTime(1);
    expect(document.getElementById('legWinModal').classList.contains('show')).toBe(false);
  });

  test('does not auto-hide when game win', () => {
    showLegWinModal('Game won', true, 0);
    expect(document.getElementById('legWinModal').classList.contains('show')).toBe(true);

    jest.advanceTimersByTime(5000);
    expect(document.getElementById('legWinModal').classList.contains('show')).toBe(true);

    hideLegWinModal();
    expect(document.getElementById('legWinModal').classList.contains('show')).toBe(false);
  });
});
