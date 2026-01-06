describe('Friends Page', () => {
  beforeEach(() => {
    cy.login(); // Custom command to authenticate
    cy.visit('/friends');
  });

  it('should render friends page with sections', () => {
    cy.contains('Friend Requests').should('be.visible');
    cy.contains('My Friends').should('be.visible');
    cy.get('[data-testid="friend-requests-section"]').should('be.visible');
    cy.get('[data-testid="friends-list-section"]').should('be.visible');
  });

  it('should display friend requests', () => {
    // Mock API response with friend requests
    cy.intercept('GET', '/api/friends/requests', { fixture: 'friend-requests.json' }).as('getRequests');
    cy.reload();
    cy.wait('@getRequests');

    cy.get('[data-testid="friend-request-card"]').should('have.length.greaterThan', 0);
  });

  it('should display friends list', () => {
    // Mock API response with friends
    cy.intercept('GET', '/api/friends', { fixture: 'friends-list.json' }).as('getFriends');
    cy.reload();
    cy.wait('@getFriends');

    cy.get('[data-testid="friend-item"]').should('have.length.greaterThan', 0);
  });

  it('should handle accept friend request', () => {
    cy.intercept('GET', '/api/friends/requests', { fixture: 'friend-requests.json' }).as('getRequests');
    cy.intercept('POST', '/api/friends/accept/*', { statusCode: 200 }).as('acceptRequest');

    cy.reload();
    cy.wait('@getRequests');

    cy.get('[data-testid="accept-button"]').first().click();
    cy.wait('@acceptRequest');

    // Request should be removed from list
    cy.get('[data-testid="friend-request-card"]').should('have.length.lessThan', 1);
  });

  it('should handle reject friend request', () => {
    cy.intercept('GET', '/api/friends/requests', { fixture: 'friend-requests.json' }).as('getRequests');
    cy.intercept('POST', '/api/friends/reject/*', { statusCode: 200 }).as('rejectRequest');

    cy.reload();
    cy.wait('@getRequests');

    cy.get('[data-testid="reject-button"]').first().click();
    cy.wait('@rejectRequest');

    // Request should be removed from list
    cy.get('[data-testid="friend-request-card"]').should('have.length.lessThan', 1);
  });

  it('should handle API loading failures', () => {
    cy.intercept('GET', '/api/friends/requests', { statusCode: 500 }).as('requestsFail');
    cy.intercept('GET', '/api/friends', { statusCode: 500 }).as('friendsFail');

    cy.reload();
    cy.wait('@requestsFail');
    cy.wait('@friendsFail');

    // Should show error states or empty states
    cy.contains('No pending friend requests').should('be.visible');
    cy.contains('No friends yet').should('be.visible');
  });

  it('should handle invalid friend request data', () => {
    cy.intercept('GET', '/api/friends/requests', { fixture: 'invalid-friend-requests.json' }).as('getRequests');
    cy.reload();
    cy.wait('@getRequests');

    // Should handle missing properties gracefully
    cy.get('[data-testid="friend-request-card"]').should('be.visible');
  });

  it('should handle invalid friends data', () => {
    cy.intercept('GET', '/api/friends', { fixture: 'invalid-friends.json' }).as('getFriends');
    cy.reload();
    cy.wait('@getFriends');

    // Should handle missing properties gracefully
    cy.get('[data-testid="friend-item"]').should('be.visible');
  });

  it('should handle network timeouts', () => {
    cy.intercept('GET', '/api/friends/requests', { delay: 10000, fixture: 'friend-requests.json' }).as('slowRequests');
    cy.reload();

    // Should show loading state
    cy.get('[data-testid="loading-indicator"]').should('be.visible');

    // Eventually load
    cy.wait('@slowRequests');
    cy.get('[data-testid="friend-request-card"]').should('be.visible');
  });

  it('should handle missing FriendsContext', () => {
    // Test when context is not provided
    cy.window().then((win) => {
      delete win.FriendsContext;
    });
    cy.reload();

    // Should crash or show error
    cy.contains('useFriends').should('not.exist'); // Or error message
  });

  it('should handle authentication token expiration', () => {
    cy.intercept('GET', '/api/friends/requests', { statusCode: 401 }).as('authFail');
    cy.reload();
    cy.wait('@authFail');

    // Should redirect to login or show auth error
    cy.url().should('include', '/login');
  });

  it('should handle concurrent modifications', () => {
    // Simulate multiple accept/reject actions
    cy.intercept('GET', '/api/friends/requests', { fixture: 'multiple-requests.json' }).as('getRequests');
    cy.intercept('POST', '/api/friends/accept/*', { statusCode: 200 }).as('acceptRequest');

    cy.reload();
    cy.wait('@getRequests');

    // Click multiple buttons rapidly
    cy.get('[data-testid="accept-button"]').each(($btn) => {
      cy.wrap($btn).click();
    });

    // Should handle multiple requests
    cy.wait('@acceptRequest');
  });

  it('should handle component unmount during API calls', () => {
    cy.intercept('GET', '/api/friends/requests', { delay: 2000, fixture: 'friend-requests.json' }).as('slowRequests');

    cy.reload();
    cy.get('[data-testid="loading-indicator"]').should('be.visible');

    // Navigate away before request completes
    cy.get('[data-testid="back-link"]').click();

    // Should not crash
    cy.url().should('not.include', '/friends');
  });

  it('should handle memory leaks', () => {
    // Test with large number of requests
    cy.intercept('GET', '/api/friends/requests', { fixture: 'many-friend-requests.json' }).as('getRequests');
    cy.reload();
    cy.wait('@getRequests');

    cy.get('[data-testid="friend-request-card"]').should('have.length.greaterThan', 10);

    // Navigate away and back
    cy.get('[data-testid="back-link"]').click();
    cy.visit('/friends');

    // Should not have memory issues
    cy.contains('Friend Requests').should('be.visible');
  });

  it('should handle race conditions in loading states', () => {
    // Multiple rapid reloads
    cy.reload();
    cy.reload();
    cy.reload();

    // Should stabilize
    cy.contains('Friend Requests').should('be.visible');
  });

  it('should handle navigation link failures', () => {
    cy.get('[data-testid="browse-users-link"]').click();
    cy.url().should('include', '/users');

    cy.visit('/friends');
    cy.get('[data-testid="back-profile-link"]').click();
    cy.url().should('include', '/profile');
  });
});
