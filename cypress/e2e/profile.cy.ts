describe('Profile Page', () => {
  beforeEach(() => {
    cy.login(); // Custom command to authenticate
    cy.visit('/profile');
  });

  it('should render profile page with user information', () => {
    cy.contains('Profile').should('be.visible');
    cy.get('[data-testid="user-name"]').should('be.visible');
    cy.get('[data-testid="user-email"]').should('be.visible');
    cy.get('[data-testid="user-bio"]').should('be.visible');
  });

  it('should display edit bio modal', () => {
    cy.get('[data-testid="edit-bio-button"]').click();
    cy.get('[data-testid="edit-modal"]').should('be.visible');
    cy.get('[data-testid="bio-textarea"]').should('be.visible');
  });

  it('should handle profile update successfully', () => {
    const newBio = 'Updated bio for testing';

    cy.intercept('PUT', '/api/profile/me', { statusCode: 200, body: { name: 'Test User', email: 'test@example.com', bio: newBio } }).as('updateProfile');

    cy.get('[data-testid="edit-bio-button"]').click();
    cy.get('[data-testid="bio-textarea"]').clear().type(newBio);
    cy.get('[data-testid="save-bio-button"]').click();

    cy.wait('@updateProfile');
    cy.get('[data-testid="user-bio"]').should('contain', newBio);
    cy.get('[data-testid="edit-modal"]').should('not.exist');
  });

  it('should handle profile update failure', () => {
    cy.intercept('PUT', '/api/profile/me', { statusCode: 422, body: { message: 'Validation failed' } }).as('updateFail');

    cy.get('[data-testid="edit-bio-button"]').click();
    cy.get('[data-testid="bio-textarea"]').clear().type('Invalid bio content');
    cy.get('[data-testid="save-bio-button"]').click();

    cy.wait('@updateFail');
    // Should show error message
    cy.contains('Validation failed').should('be.visible');
  });

  it('should handle logout', () => {
    cy.get('[data-testid="logout-button"]').click();
    cy.url().should('include', '/login');
  });

  it('should handle missing auth context', () => {
    // Test when user is not authenticated
    cy.window().then((win) => {
      // Clear auth context
      win.localStorage.removeItem('auth_token');
    });
    cy.reload();

    // Should redirect to login
    cy.url().should('include', '/login');
  });

  it('should handle invalid user data', () => {
    // Mock invalid user object
    cy.window().then((win) => {
      win.AuthContext = { user: { name: null, email: undefined } };
    });
    cy.reload();

    // Should handle gracefully
    cy.contains('Profile').should('be.visible');
  });

  it('should handle modal state corruption', () => {
    // Rapid clicks on edit button
    cy.get('[data-testid="edit-bio-button"]').click();
    cy.get('[data-testid="edit-bio-button"]').click();
    cy.get('[data-testid="edit-bio-button"]').click();

    // Modal should be in consistent state
    cy.get('[data-testid="edit-modal"]').should('have.length', 1);
  });

  it('should handle concurrent profile updates', () => {
    cy.intercept('PUT', '/api/profile/me', { statusCode: 200, body: { name: 'Test User', email: 'test@example.com', bio: 'Updated bio' } }).as('updateProfile');

    // Trigger multiple updates
    cy.get('[data-testid="edit-bio-button"]').click();
    cy.get('[data-testid="bio-textarea"]').type('First update');
    cy.get('[data-testid="save-bio-button"]').click();

    cy.get('[data-testid="edit-bio-button"]').click();
    cy.get('[data-testid="bio-textarea"]').type('Second update');
    cy.get('[data-testid="save-bio-button"]').click();

    // Should handle both requests
    cy.wait('@updateProfile');
  });

  it('should handle component unmount during update', () => {
    cy.intercept('PUT', '/api/profile/me', { delay: 2000, statusCode: 200 }).as('slowUpdate');

    cy.get('[data-testid="edit-bio-button"]').click();
    cy.get('[data-testid="bio-textarea"]').type('Test bio');
    cy.get('[data-testid="save-bio-button"]').click();

    // Navigate away before update completes
    cy.get('[data-testid="back-link"]').click();

    // Should not crash
    cy.url().should('not.include', '/profile');
  });

  it('should handle form validation edge cases', () => {
    cy.get('[data-testid="edit-bio-button"]').click();

    // Test with extremely long bio
    const longBio = 'A'.repeat(10000);
    cy.get('[data-testid="bio-textarea"]').type(longBio);
    cy.get('[data-testid="save-bio-button"]').click();

    // Should handle or validate
    cy.get('[data-testid="edit-modal"]').should('be.visible');
  });

  it('should handle context update race conditions', () => {
    // Rapid context updates
    cy.window().then((win) => {
      win.AuthContext.updateUser({ name: 'Updated Name 1' });
      win.AuthContext.updateUser({ name: 'Updated Name 2' });
      win.AuthContext.updateUser({ name: 'Updated Name 3' });
    });

    // UI should reflect final state
    cy.get('[data-testid="user-name"]').should('contain', 'Updated Name 3');
  });

  it('should handle browser storage failures', () => {
    cy.window().then((win) => {
      // Mock storage failure
      Object.defineProperty(win, 'localStorage', {
        get: () => { throw new Error('Storage unavailable'); }
      });
    });
    cy.reload();

    // Should handle gracefully
    cy.contains('Profile').should('be.visible');
  });

  it('should handle profile card rendering failures', () => {
    // Mock invalid props to ProfileCard
    cy.window().then((win) => {
      win.AuthContext = { user: null };
    });
    cy.reload();

    // Should show error or fallback
    cy.contains('Profile').should('be.visible');
  });

  it('should handle navigation link failures', () => {
    cy.get('[data-testid="users-link"]').click();
    cy.url().should('include', '/users');

    cy.visit('/profile');
    cy.get('[data-testid="friends-link"]').click();
    cy.url().should('include', '/friends');
  });

  it('should handle logout process interruptions', () => {
    cy.intercept('POST', '/api/logout', { delay: 5000 }).as('slowLogout');

    cy.get('[data-testid="logout-button"]').click();

    // Should eventually redirect
    cy.wait('@slowLogout');
    cy.url().should('include', '/login');
  });

  it('should handle memory issues with large profile data', () => {
    // Mock large bio
    const largeBio = 'A'.repeat(100000);
    cy.window().then((win) => {
      win.AuthContext = { user: { name: 'Test', email: 'test@example.com', bio: largeBio } };
    });
    cy.reload();

    // Should handle large content
    cy.get('[data-testid="user-bio"]').should('be.visible');
  });
});
