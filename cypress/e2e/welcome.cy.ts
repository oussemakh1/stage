describe('Welcome Page', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should render welcome page with navigation', () => {
    // Check basic elements
    cy.get('header').should('be.visible');
    cy.get('nav').should('be.visible');

    // Check navigation links
    cy.contains('Log in').should('be.visible');
    cy.contains('Register').should('be.visible');
  });

  it('should show dashboard link when authenticated', () => {
    // Mock authenticated user
    cy.login(); // Custom command
    cy.reload();

    cy.contains('Dashboard').should('be.visible');
    cy.contains('Log in').should('not.exist');
    cy.contains('Register').should('not.exist');
  });

  it('should handle missing auth props gracefully', () => {
    // Test when auth.user is undefined
    cy.intercept('/', { fixture: 'welcome-no-auth.json' }).as('welcome');
    cy.reload();
    cy.wait('@welcome');

    // Should still render basic page
    cy.contains('Log in').should('be.visible');
  });

  it('should handle route resolution failures', () => {
    // Mock route function failures
    cy.window().then((win) => {
      win.login = () => { throw new Error('Route not found'); };
      win.register = () => { throw new Error('Route not found'); };
      win.dashboard = () => { throw new Error('Route not found'); };
    });
    cy.reload();

    // Links should be visible but non-functional
    cy.contains('Log in').should('be.visible');
    cy.contains('Register').should('be.visible');
  });

  it('should handle missing canRegister prop', () => {
    // Test when canRegister is undefined
    cy.intercept('/', { fixture: 'welcome-no-register.json' }).as('welcome');
    cy.reload();
    cy.wait('@welcome');

    // Should default to showing register link
    cy.contains('Register').should('be.visible');
  });

  it('should handle CSS loading failures', () => {
    // Test when Tailwind CSS fails to load
    cy.window().then((win) => {
      // Remove Tailwind classes
      const elements = win.document.querySelectorAll('[class*="bg-"], [class*="text-"]');
      elements.forEach(el => el.className = '');
    });

    // Page should still be functional
    cy.contains('Log in').should('be.visible');
  });

  it('should handle dark mode theme issues', () => {
    // Test dark mode classes
    cy.get('html').should('have.class', 'dark');

    // Check dark mode specific elements
    cy.get('.dark\\:bg-gray-900').should('be.visible');
  });

  it('should handle Inertia navigation failures', () => {
    // Test when Inertia Link fails
    cy.get('a[href*="login"]').first().click();

    // Should navigate or show error
    cy.url().should('include', '/login');
  });

  it('should handle missing shared data', () => {
    // Test when usePage props are empty
    cy.intercept('/', { fixture: 'welcome-empty-props.json' }).as('welcome');
    cy.reload();
    cy.wait('@welcome');

    // Should render with defaults
    cy.contains('Log in').should('be.visible');
  });

  it('should handle registration feature disabled', () => {
    // Test when canRegister is false
    cy.intercept('/', { fixture: 'welcome-register-disabled.json' }).as('welcome');
    cy.reload();
    cy.wait('@welcome');

    cy.contains('Register').should('not.exist');
    cy.contains('Log in').should('be.visible');
  });

  it('should handle link styling failures', () => {
    // Test when link classes don't apply
    cy.get('a').should('have.attr', 'href');

    // Links should still be clickable
    cy.get('a').first().should('be.visible');
  });

  it('should handle browser compatibility issues', () => {
    // Test in different browsers/viewports
    cy.viewport('iphone-6');
    cy.contains('Log in').should('be.visible');

    cy.viewport(1920, 1080);
    cy.contains('Log in').should('be.visible');
  });

  it('should handle accessibility requirements', () => {
    // Test accessibility
    cy.injectAxe();
    cy.checkA11y();
  });
});
