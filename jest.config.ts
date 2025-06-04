module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/'], 

  collectCoverageFrom: [
    'src/**/*.service.ts',
    'src/**/*.controller.ts',
    'src/**/*.module.ts',

    '!src/main.ts', 
    '!src/**/*.entity.ts', 
    '!src/**/*.dto.ts',
    '!src/common/pipes/uuid-validation.pipe.ts', 
    '!src/common/pipes/specific-optional-image-validation.pipe.ts',
    '!src/common/pipes/role-validation.pipe.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80, 
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};