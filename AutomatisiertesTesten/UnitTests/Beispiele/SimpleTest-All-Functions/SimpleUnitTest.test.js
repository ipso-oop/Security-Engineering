const sum = require('./sum');

describe('Funktion sum', () => {
  // Teststrukturierung: Verschiedene Testfälle in Gruppen
  beforeAll(() => {
    console.log('Tests starten...');
  });

  afterAll(() => {
    console.log('Tests abgeschlossen.');
  });

  beforeEach(() => {
    console.log('Vor jedem Test wird etwas vorbereitet.');
  });

  afterEach(() => {
    console.log('Nach jedem Test wird aufgeräumt.');
  });

  // Test: Basisfunktionalität
  test('adds 1 + 2 to equal 3', () => {
    expect(sum(1, 2)).toBe(3); // Basic Assertion
  });

  // Test: Negative Zahlen
  test('adds -1 + (-2) to equal -3', () => {
    expect(sum(-1, -2)).toBe(-3); // Negativfall testen
  });

  // Test: Mit Null
  test('adds 0 + 5 to equal 5', () => {
    expect(sum(0, 5)).toBe(5); // Test mit 0
  });

  // Assertion für Objekte
  test('Objektvergleiche sind konsistent', () => {
    const obj = { a: 1, b: 2 };
    expect(obj).toEqual({ a: 1, b: 2 }); // Deep Compare
  });

  // Mock-Funktion
  test('Mock-Funktion wird aufgerufen', () => {
    const mockFn = jest.fn().mockReturnValue(3); // Mock mit Rückgabewert
    expect(mockFn()).toBe(3);
    expect(mockFn).toHaveBeenCalled(); // Überprüfen, ob Mock aufgerufen wurde
  });


  // Timer-Mocking
  test('Timer simulieren', () => {
    jest.useFakeTimers(); // Fake-Timer aktivieren
    const callback = jest.fn();

    setTimeout(callback, 1000);
    jest.advanceTimersByTime(1000); // Zeit um 1000ms vorrücken

    expect(callback).toHaveBeenCalled(); // Überprüfen, ob der Timer funktioniert
  });

  // Test mit Ausnahme
  test('wirft Fehler bei ungültigen Eingaben', () => {
    const invalidSum = () => sum("ab",2); // Simulierte Fehlerauslösung
    expect(invalidSum).toThrow(); // Überprüfen, ob ein Fehler geworfen wird
  });
});
