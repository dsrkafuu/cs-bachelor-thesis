require('dotenv').config();

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  testEnvironment: 'jsdom',
  collectCoverage: true,
  preset: 'ts-jest',
  moduleNameMapper: {
    '\\.(css|less|scss)$': 'identity-obj-proxy',
    '\\.(png|jpg)$': '<rootDir>/test/__mocks__/file.js',
    '\\.svg': '<rootDir>/test/__mocks__/svg.js',
  },
};
