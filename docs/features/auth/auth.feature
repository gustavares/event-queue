Feature: Authentication
  As a user of Event Queue
  I want to create an account, sign in, and have my session persist
  So that I can manage events and lists across sessions

  Background:
    Given the Event Queue app is open

  # ────────────────────────────────────────────────
  # Sign Up
  # ────────────────────────────────────────────────

  @AC-1 @BR-AUTH-001 @BR-AUTH-002 @BR-AUTH-003 @BR-AUTH-004
  Scenario: User signs up with valid credentials
    Given I am on the sign-up screen
    When I submit the sign-up form with:
      | name     | Ana Santos      |
      | email    | ana@example.com |
      | password | strongpass123   |
    Then my account is created
    And a session token is issued and stored
    And I am taken to the app home

  @AC-1 @error @EDGE-1
  Scenario: Sign-up rejects a duplicate email
    Given an account already exists for "ana@example.com"
    And I am on the sign-up screen
    When I submit the sign-up form with:
      | name     | Ana Santos      |
      | email    | ana@example.com |
      | password | strongpass123   |
    Then I see the error "An account with this email already exists"
    And I remain on the sign-up screen
    And no new account is created

  @EDGE-2 @error
  Scenario Outline: Empty sign-up fields are blocked client-side
    Given I am on the sign-up screen
    When I submit the sign-up form leaving <field> empty
    Then the form is not submitted
    And the empty <field> is highlighted

    Examples:
      | field    |
      | name     |
      | email    |
      | password |

  # ────────────────────────────────────────────────
  # Sign In
  # ────────────────────────────────────────────────

  @AC-2 @BR-AUTH-003 @BR-AUTH-004
  Scenario: User signs in with valid credentials
    Given an account exists for "ana@example.com" with password "strongpass123"
    And I am on the sign-in screen
    When I submit the sign-in form with:
      | email    | ana@example.com |
      | password | strongpass123   |
    Then a session token is issued and stored
    And I am taken to the app home

  @AC-2 @error
  Scenario: Sign-in rejects a wrong password
    Given an account exists for "ana@example.com" with password "strongpass123"
    And I am on the sign-in screen
    When I submit the sign-in form with:
      | email    | ana@example.com |
      | password | wrongpassword   |
    Then I see the error "Invalid email or password"
    And I remain on the sign-in screen

  @AC-2 @error
  Scenario: Sign-in rejects an unknown email
    Given no account exists for "ghost@example.com"
    And I am on the sign-in screen
    When I submit the sign-in form with:
      | email    | ghost@example.com |
      | password | anything          |
    Then I see the error "Invalid email or password"
    And I remain on the sign-in screen

  @EDGE-2 @error
  Scenario Outline: Empty sign-in fields are blocked client-side
    Given I am on the sign-in screen
    When I submit the sign-in form leaving <field> empty
    Then the form is not submitted
    And the empty <field> is highlighted

    Examples:
      | field    |
      | email    |
      | password |

  @EDGE-4 @error
  Scenario: Network error during sign-in shows a friendly message
    Given an account exists for "ana@example.com" with password "strongpass123"
    And the network is unavailable
    And I am on the sign-in screen
    When I submit the sign-in form with valid credentials
    Then I see the error "Network error — please check your connection and try again"
    And I remain on the sign-in screen

  # ────────────────────────────────────────────────
  # Auth gating & redirects
  # ────────────────────────────────────────────────

  @AC-3
  Scenario: Unauthenticated user is redirected to sign-in
    Given I am not signed in
    When I open the app
    Then I am redirected to the sign-in screen

  @AC-4
  Scenario: Authenticated user is redirected away from auth screens
    Given I am signed in
    When I navigate to the sign-in screen
    Then I am redirected to the app home

  @AC-4
  Scenario: Authenticated user is redirected away from sign-up
    Given I am signed in
    When I navigate to the sign-up screen
    Then I am redirected to the app home

  # ────────────────────────────────────────────────
  # Session restore
  # ────────────────────────────────────────────────

  @AC-5 @BR-AUTH-005
  Scenario: Session is restored on app launch with a valid token
    Given I signed in previously and my token is still valid
    When I reopen the app
    Then my session is restored
    And I land on the app home without entering credentials

  @AC-3 @BR-AUTH-006 @EDGE-3 @error
  Scenario: Expired token on restore silently redirects to sign-in
    Given I signed in previously and my token has expired
    When I reopen the app
    Then no error message is shown
    And I am redirected to the sign-in screen

  @EDGE-3 @error
  Scenario: Token that expires mid-session redirects on next request
    Given I am signed in and viewing a protected screen
    When my token expires
    And I trigger any data-loading action
    Then my session is cleared
    And I am redirected to the sign-in screen

  # ────────────────────────────────────────────────
  # Sign Out
  # ────────────────────────────────────────────────

  @AC-6
  Scenario: Sign out clears the session and returns to sign-in
    Given I am signed in
    When I sign out
    Then my stored token is removed
    And I am redirected to the sign-in screen
