/// <reference types="cypress" />

const lgBtn = '#login > div.ant-row.ant-form-item > div > div > div > button';
const usrLabel = '#root > section > header > div > span:nth-child(2)';
describe('try login and logout', () => {
  it('try login', () => {
    cy.visit('/login');
    cy.get('#login_username').type('dsrkafuu');
    cy.get('#login_password').type('000322');
    cy.get(lgBtn).click();
    cy.url().should('eq', 'http://localhost:3000/');
    cy.get(usrLabel).should('contain', 'dsrkafuu');
  });
});
