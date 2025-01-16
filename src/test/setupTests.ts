import '@testing-library/jest-dom';
import { cleanup, render } from '@testing-library/react';
import { expect, afterEach, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactElement } from 'react';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost:3000',
  pretendToBeVisual: true,
  resources: 'usable'
});

global.window = dom.window as unknown as Window & typeof globalThis;
global.document = dom.window.document;
global.navigator = {
  userAgent: 'node.js',
} as Navigator;

global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
} as Storage;

global.window.matchMedia = vi.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

export function renderWithClient(ui: ReactElement) {
  const testQueryClient = createTestQueryClient();
  const { rerender, ...result } = render(
    <QueryClientProvider client={testQueryClient}>{ui}</QueryClientProvider>
  );
  return {
    ...result,
    rerender: (rerenderUi: ReactElement) =>
      rerender(
        <QueryClientProvider client={testQueryClient}>{rerenderUi}</QueryClientProvider>
      ),
  };
}

export { createTestQueryClient };

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
});