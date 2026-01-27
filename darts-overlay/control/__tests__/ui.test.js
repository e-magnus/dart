/** @jest-environment jsdom */

const { showBustModal } = require('../ui.js');

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
    showBustModal(50, 50, 'Þú verð að enda með double eða bull (25/50)!');

    expect(document.getElementById('bustPlayerName').textContent).toBe('Leikmaður 1');
    expect(document.getElementById('bustMessage').textContent).toBe('Þú verð að enda með double eða bull (25/50)!');
    expect(document.getElementById('bustModal').classList.contains('show')).toBe(true);
  });

  test('shows remaining score when no reason provided', () => {
    showBustModal(32, 40);

    expect(document.getElementById('bustMessage').textContent).toBe(String(32 - 40));
    expect(document.getElementById('bustModal').classList.contains('show')).toBe(true);
  });
});
