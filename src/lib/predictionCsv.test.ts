import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserPrediction } from './api-client';
import {
  PREDICTION_CSV_HEADERS,
  buildPredictionCsv,
  downloadCsv,
  escapeCsvField,
  predictionCsvFilename,
} from './predictionCsv';

const lines = (csv: string) => csv.split('\n');

describe('escapeCsvField', () => {
  it('leaves plain text untouched', () => {
    expect(escapeCsvField('UP')).toBe('UP');
    expect(escapeCsvField('2026-07-29T10:00:00.000Z')).toBe('2026-07-29T10:00:00.000Z');
    expect(escapeCsvField('')).toBe('');
  });

  it('quotes fields containing a comma, quote or line break', () => {
    expect(escapeCsvField('a,b')).toBe('"a,b"');
    expect(escapeCsvField('line1\nline2')).toBe('"line1\nline2"');
    expect(escapeCsvField('line1\r\nline2')).toBe('"line1\r\nline2"');
  });

  it('doubles embedded double quotes', () => {
    expect(escapeCsvField('say "hi"')).toBe('"say ""hi"""');
  });

  it.each(['=SUM(A1:A9)', '+1+1', '-2+3', '@cmd', '\tcmd', '\rcmd'])(
    'defuses spreadsheet formula text %j with a leading quote',
    (value) => {
      const out = escapeCsvField(value);
      expect(out.replace(/^"/, '').startsWith("'")).toBe(true);
    },
  );

  it('does not mangle plain numbers, including negative ones', () => {
    expect(escapeCsvField('-5')).toBe('-5');
    expect(escapeCsvField('10.5')).toBe('10.5');
  });

  it('still quotes a defused value that needs quoting', () => {
    expect(escapeCsvField('=A1,B1')).toBe('"\'=A1,B1"');
  });
});

describe('buildPredictionCsv', () => {
  it('starts with the header: asset, direction, stake, result, timestamp', () => {
    expect(PREDICTION_CSV_HEADERS).toEqual(['asset', 'direction', 'stake', 'result', 'timestamp']);
    expect(buildPredictionCsv([])).toBe('asset,direction,stake,result,timestamp');
  });

  it('maps each prediction to one row in column order', () => {
    const csv = buildPredictionCsv([
      { id: 1, asset: 'BTC', direction: 'UP', stake: 10.5, status: 'WON', createdAt: '2026-07-29T10:00:00.000Z' },
      { id: 2, asset: 'XLM', direction: 'DOWN', stake: '20', status: 'LOST', createdAt: '2026-07-29T10:05:00.000Z' },
    ]);

    expect(lines(csv)).toEqual([
      'asset,direction,stake,result,timestamp',
      'BTC,UP,10.5,WON,2026-07-29T10:00:00.000Z',
      'XLM,DOWN,20,LOST,2026-07-29T10:05:00.000Z',
    ]);
  });

  it('leaves missing fields empty instead of printing "undefined"', () => {
    const csv = buildPredictionCsv([{ id: 1 }]);

    expect(lines(csv)[1]).toBe(',,,,');
    expect(csv).not.toMatch(/undefined|null/);
  });

  it('ignores values of the wrong type', () => {
    const csv = buildPredictionCsv([
      { id: 1, asset: 42, direction: { up: true }, stake: NaN, status: ['WON'], createdAt: 1234 } as unknown as UserPrediction,
    ]);

    expect(lines(csv)[1]).toBe(',,,,');
  });

  it('keeps a row on one line and quotes awkward values', () => {
    const csv = buildPredictionCsv([
      { id: 1, asset: 'BTC', direction: 'UP', stake: 1, status: 'a,b "c"\nd', createdAt: 't' },
    ]);

    expect(csv).toContain('"a,b ""c""\nd"');
  });

  it('defuses formula text coming from the API', () => {
    const csv = buildPredictionCsv([
      { id: 1, asset: '=HYPERLINK("http://evil")', direction: 'UP', stake: 1, status: '@x', createdAt: 't' },
    ]);
    const row = lines(csv)[1];

    expect(row.startsWith('"\'=HYPERLINK')).toBe(true);
    expect(row).toContain(",'@x,");
  });

  it('exports every prediction it is given, in order', () => {
    const many: UserPrediction[] = Array.from({ length: 250 }, (_, i) => ({ id: i, stake: i }));
    const rows = lines(buildPredictionCsv(many));

    expect(rows).toHaveLength(251);
    expect(rows[1]).toBe(',,0,,');
    expect(rows[250]).toBe(',,249,,');
  });

  it('does not mutate its input', () => {
    const input: UserPrediction[] = [{ id: 1, asset: 'BTC', stake: 5 }];
    const copy = JSON.parse(JSON.stringify(input));

    buildPredictionCsv(input);

    expect(input).toEqual(copy);
  });
});

describe('predictionCsvFilename', () => {
  it('uses the user id', () => {
    expect(predictionCsvFilename('test-user-123')).toBe('prediction_history_test-user-123.csv');
  });

  it('falls back to "user" and strips characters that are unsafe in file names', () => {
    expect(predictionCsvFilename(null)).toBe('prediction_history_user.csv');
    expect(predictionCsvFilename(undefined)).toBe('prediction_history_user.csv');
    expect(predictionCsvFilename('a/b\\c:d')).toBe('prediction_history_a_b_c_d.csv');
  });
});

describe('downloadCsv', () => {
  const createObjectURL = vi.fn(() => 'blob:mock-url');
  const revokeObjectURL = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout'] });
    global.URL.createObjectURL = createObjectURL;
    global.URL.revokeObjectURL = revokeObjectURL;
    createObjectURL.mockClear();
    revokeObjectURL.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('downloads the CSV as a UTF-8 text/csv file with the given name', () => {
    const blobSpy = vi.spyOn(global, 'Blob');
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    downloadCsv('history.csv', 'a,b\n1,2');

    // The spy records which anchor element was clicked.
    const clicked = clickSpy.mock.contexts[0] as HTMLAnchorElement;
    expect(blobSpy).toHaveBeenCalledWith(['a,b\n1,2'], { type: 'text/csv;charset=utf-8;' });
    expect(clicked.getAttribute('href')).toBe('blob:mock-url');
    expect(clicked.getAttribute('download')).toBe('history.csv');
  });

  it('cleans the temporary link out of the page', () => {
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    downloadCsv('history.csv', 'x');

    expect(document.body.querySelector('a[download]')).toBeNull();
  });

  it('revokes the object URL after a delay, not in the same tick', () => {
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    downloadCsv('history.csv', 'x');
    expect(revokeObjectURL).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });
});
