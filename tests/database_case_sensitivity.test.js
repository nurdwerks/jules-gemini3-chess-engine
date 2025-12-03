const mockGet = jest.fn();
const mockPut = jest.fn();
// Iterator needs to be an async generator
const mockIterator = jest.fn().mockImplementation(async function* () {
    yield ['user:testuser', { username: 'TestUser' }];
});

jest.mock('classic-level', () => {
  return {
    ClassicLevel: jest.fn().mockImplementation(() => {
      return {
        get: mockGet,
        put: mockPut,
        iterator: mockIterator,
        open: jest.fn(),
        close: jest.fn()
      };
    })
  };
});

const db = require('../src/Database');

describe('Database Case Sensitivity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getUser should lower case the username key', async () => {
    mockGet.mockResolvedValue({ username: 'TestUser' });

    // This should convert 'TestUser' to 'user:testuser'
    await db.getUser('TestUser');

    expect(mockGet).toHaveBeenCalledWith('user:testuser');
  });

  test('saveUser should lower case the username key', async () => {
    const userData = { username: 'TestUser' };
    await db.saveUser('TestUser', userData);

    expect(mockPut).toHaveBeenCalledWith('user:testuser', userData);
  });

  test('saveUserData should lower case the username key', async () => {
    mockGet.mockResolvedValue({ username: 'TestUser', userData: {} });
    await db.saveUserData('TestUser', 'key', 'value');

    // First it gets the user
    expect(mockGet).toHaveBeenCalledWith('user:testuser');
    // Then it puts the user back
    expect(mockPut).toHaveBeenCalledWith('user:testuser', expect.objectContaining({
        username: 'TestUser',
        userData: { key: 'value' }
    }));
  });
});
