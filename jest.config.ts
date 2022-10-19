/* eslint-disable import/no-anonymous-default-export */
export default {
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!jest.config.ts',
    '!jest.setup.ts',
    '!**/{*.stories.tsx,index.ts,index.tsx,types.ts}',
  ],
  testMatch: ['<rootDir>/**/*.test.ts(x)?'],
  transform: {
    '^.+\\.tsx?$': ['jest-esbuild', {}],
  },
}
