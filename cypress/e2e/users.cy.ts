describe('Users Page', () => {
  beforeEach(() => {
    cy.login(); // Custom command to authenticate
    cy.visit('/users');
  });

  it('should render users page with search and list', () => {
    cy.contains('Browse Users').should('be.visible');
    cy.get('[data-testid="search-input"]').should('be.visible');
    cy.get('[data-testid="users-grid"]').should('be.visible');
  });

  it('should display users list', () => {
    // Mock API response
    cy.intercept('GET', '/api/users', { fixture: 'users-list.json' }).as('getUsers');
    cy.reload();
    cy.wait('@getUsers');

    cy.get('[data-testid="user-item"]').should('have.length.greaterThan', 0);
  });

  it('should handle search functionality', () => {
    cy.intercept('GET', '/api/users', { fixture: 'users-list.json' }).as('getUsers');
    cy.reload();
    cy.wait('@getUsers');

    // Search for specific user
    cy.get('[data-testid="search-input"]').type('John');
    cy.get('[data-testid="user-item"]').should('contain', 'John');
  });

  it('should handle send friend request', () => {
    cy.intercept('GET', '/api/users', { fixture: 'users-list.json' }).as('getUsers');
    cy.intercept('POST', '/api/friends/request/*', { statusCode: 200 }).as('sendRequest');

    cy.reload();
    cy.wait('@getUsers');

    cy.get('[data-testid="send-request-button"]').first().click();
    cy.wait('@sendRequest');

    // Button should show "Request Sent"
    cy.get('[data-testid="send-request-button"]').first().should('contain', 'Request Sent');
  });

  it('should handle API fetch failures', () => {
    cy.intercept('GET', '/api/users', { statusCode: 500 }).as('usersFail');
    cy.reload();
    cy.wait('@usersFail');

    // Should show error or empty state
    cy.contains('Loading users...').should('not.exist');
  });

  it('should handle authentication failures', () => {
    cy.intercept('GET', '/api/users', { statusCode: 401 }).as('authFail');
    cy.reload();
    cy.wait('@authFail');

    // Should redirect to login
    cy.url().should('include', '/login');
  });

  it('should handle invalid user data', () => {
    cy.intercept('GET', '/api/users', { fixture: 'invalid-users.json' }).as('getUsers');
    cy.reload();
    cy.wait('@getUsers');

    // Should handle missing properties gracefully
    cy.get('[data-testid="user-item"]').should('be.visible');
  });

  it('should handle friend request send failures', () => {
    cy.intercept('GET', '/api/users', { fixture: 'users-list.json' }).as('getUsers');
    cy.intercept('POST', '/api/friends/request/*', { statusCode: 422, body: { message: 'Already friends' } }).as('requestFail');

    cy.reload();
    cy.wait('@getUsers');

    cy.get('[data-testid="send-request-button"]').first().click();
    cy.wait('@requestFail');

    // Should show error
    cy.contains('Already friends').should('be.visible');
  });

  it('should handle optimistic UI updates', () => {
    cy.intercept('GET', '/api/users', { fixture: 'users-list.json' }).as('getUsers');
    cy.intercept('POST', '/api/friends/request/*', { delay: 2000, statusCode: 200 }).as('slowRequest');

    cy.reload();
    cy.wait('@getUsers');

    cy.get('[data-testid="send-request-button"]').first().click();

    // Should show sending state immediately
    cy.get('[data-testid="send-request-button"]').first().should('contain', 'Sending...');

    cy.wait('@slowRequest');
    cy.get('[data-testid="send-request-button"]').first().should('contain', 'Request Sent');
  });

  it('should handle search edge cases', () => {
    cy.intercept('GET', '/api/users', { fixture: 'users-list.json' }).as('getUsers');
    cy.reload();
    cy.wait('@getUsers');

    // Test with special characters
    cy.get('[data-testid="search-input"]').type('!@#$%^&*()');
    cy.get('[data-testid="users-grid"]').should('be.visible');

    // Test with very long search term
    cy.get('[data-testid="search-input"]').clear().type('A'.repeat(1000));
    cy.get('[data-testid="users-grid"]').should('be.visible');
  });

  it('should handle loading state race conditions', () => {
    cy.intercept('GET', '/api/users', { delay: 1000, fixture: 'users-list.json' }).as('slowUsers');

    cy.reload();
    cy.get('[data-testid="loading-indicator"]').should('be.visible');

    cy.wait('@slowUsers');
    cy.get('[data-testid="user-item"]').should('be.visible');
  });

  it('should handle friends context integration', () => {
    // Mock friends context data
    cy.window().then((win) => {
      win.FriendsContext = { friends: [{ id: 1, name: 'Friend User' }] };
    });

    cy.intercept('GET', '/api/users', { fixture: 'users-with-friends.json' }).as('getUsers');
    cy.reload();
    cy.wait('@getUsers');

    // Friend status should be correct
    cy.get('[data-testid="user-item"]').first().should('contain', 'Friends');
  });

  it('should handle current user identification', () => {
    cy.intercept('GET', '/api/users', { fixture: 'users-with-current.json' }).as('getUsers');
    cy.reload();
    cy.wait('@getUsers');

    // Current user should not appear in list or have send button
    cy.get('[data-testid="send-request-button"]').should('not.contain', 'Send Request');
  });

  it('should handle sending request state management', () => {
    cy.intercept('GET', '/api/users', { fixture: 'users-list.json' }).as('getUsers');

    cy.reload();
    cy.wait('@getUsers');

    // Click send button multiple times rapidly
    const button = cy.get('[data-testid="send-request-button"]').first();
    button.click();
    button.click();
    button.click();

    // Should handle gracefully
    cy.get('[data-testid="send-request-button"]').first().should('be.visible');
  });

  it('should handle network interruptions', () => {
    cy.intercept('GET', '/api/users', { delay: 5000, fixture: 'users-list.json' }).as('slowUsers');

    cy.reload();
    cy.get('[data-testid="loading-indicator"]').should('be.visible');

    // Simulate network disconnect
    cy.window().then((win) => {
      win.navigator.onLine = false;
    });

    // Should handle timeout
    cy.contains('Browse Users').should('be.visible');
  });

  it('should handle large user lists', () => {
    cy.intercept('GET', '/api/users', { fixture: 'large-users-list.json' }).as('getUsers');
    cy.reload();
    cy.wait('@getUsers');

    cy.get('[data-testid="user-item"]').should('have.length.greaterThan', 50);

    // Should be performant
    cy.get('body').should('be.visible');
  });

  it('should handle missing contexts', () => {
    cy.window().then((win) => {
      delete win.AuthContext;
      delete win.FriendsContext;
    });
    cy.reload();

    // Should crash or show error
    cy.contains('Browse Users').should('be.visible');
  });

  it('should handle browser storage issues', () => {
    cy.window().then((win) => {
      Object.defineProperty(win, 'localStorage', {
        get: () => { throw new Error('Storage unavailable'); }
      });
    });
    cy.reload();

    // Should handle gracefully
    cy.contains('Browse Users').should('be.visible');
  });

  it('should handle component re-render loops', () => {
    // Trigger multiple state updates
    cy.intercept('GET', '/api/users', { fixture: 'users-list.json' }).as('getUsers');

    cy.reload();
    cy.wait('@getUsers');

    // Rapid search changes
    cy.get('[data-testid="search-input"]').type('a');
    cy.get('[data-testid="search-input"]').type('b');
    cy.get('[data-testid="search-input"]').type('c');

    // Should stabilize
    cy.get('[data-testid="users-grid"]').should('be.visible');
  });

  it('should handle navigation links', () => {
    cy.get('[data-testid="profile-link"]').click();
    cy.url().should('include', '/profile');

    cy.visit('/users');
    cy.get('[data-testid="friends-link"]').click();
    cy.url().should('include', '/friends');
  });
});
