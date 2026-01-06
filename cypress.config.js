export default {
  e2e: {
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    baseUrl: 'http://localhost:8000',
    video: false,
    retries: 1,
    supportFile: false,
  },
}
