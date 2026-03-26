jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('../config/sentry', () => ({
  Sentry: { captureException: jest.fn() },
}));

import { useUnitsStore } from '../store/unitsStore';

describe('unitsStore', () => {
  beforeEach(() => {
    useUnitsStore.setState({ unitSystem: 'metric' });
  });

  it('starts with metric system', () => {
    expect(useUnitsStore.getState().unitSystem).toBe('metric');
  });

  it('switches to imperial', () => {
    useUnitsStore.getState().setUnitSystem('imperial');
    expect(useUnitsStore.getState().unitSystem).toBe('imperial');
  });

  it('switches back to metric', () => {
    useUnitsStore.getState().setUnitSystem('imperial');
    useUnitsStore.getState().setUnitSystem('metric');
    expect(useUnitsStore.getState().unitSystem).toBe('metric');
  });
});
