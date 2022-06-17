require('dotenv').config();

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  preset: 'ts-jest',
};
