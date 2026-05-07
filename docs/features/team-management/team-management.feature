Feature: Event Team Management
  As a Manager of an event
  I want to add, remove, and reassign team members and see who is on the team
  So that the right people can run lists, check-in, and door sales for my event

  Background:
    Given I am signed in as a Manager
    And I am the Manager of event "Birthday Bash"

  # ─────────────────────────────────────────────────────
  # Adding team members
  # ─────────────────────────────────────────────────────

  @AC-1 @BR-TEAM-002 @BR-ROLE-002 @BR-ROLE-004
  Scenario: Manager adds a Promoter by email
    Given a user "ana@example.com" exists
    When I add "ana@example.com" to the team as a Promoter
    Then "ana@example.com" is on the team of "Birthday Bash" with role Promoter
    And the team list shows "ana@example.com" as a Promoter

  @AC-2 @BR-TEAM-002 @BR-ROLE-002
  Scenario: Manager adds a Host by email
    Given a user "joao@example.com" exists
    When I add "joao@example.com" to the team as a Host
    Then "joao@example.com" is on the team of "Birthday Bash" with role Host
    And the team list shows "joao@example.com" as a Host

  @AC-3 @BR-ROLE-005 @BR-TEAM-002
  Scenario: Manager promotes another user to Manager
    Given a user "maria@example.com" exists
    When I add "maria@example.com" to the team as a Manager
    Then "maria@example.com" is on the team of "Birthday Bash" with role Manager
    And the team list shows "maria@example.com" as a Manager

  @AC-1 @AC-2 @AC-3
  Scenario Outline: Manager adds a registered user with each role
    Given a user "<email>" exists
    When I add "<email>" to the team as a <role>
    Then "<email>" is on the team of "Birthday Bash" with role <role>

    Examples:
      | email             | role     |
      | ana@example.com   | Promoter |
      | joao@example.com  | Host     |
      | maria@example.com | Manager  |

  @AC-10 @BR-TEAM-002 @error
  Scenario: Adding an unknown email is rejected
    Given no account exists for "ghost@example.com"
    When I add "ghost@example.com" to the team as a Promoter
    Then I see the error "No account found for that email"
    And no team member is added
    And I remain on the add-member form

  @AC-11 @BR-TEAM-003 @error @edge-case @EDGE-2
  Scenario: Adding a user who is already on the team is rejected
    Given a user "ana@example.com" exists
    And "ana@example.com" is already on the team of "Birthday Bash" as a Promoter
    When I add "ana@example.com" to the team as a Host
    Then I see the error "This user is already on the team"
    And the team membership of "ana@example.com" remains Promoter

  @edge-case @EDGE-6
  Scenario: Email lookup is case-insensitive
    Given a user "ana@example.com" exists
    When I add "Ana@Example.com" to the team as a Promoter
    Then "ana@example.com" is on the team of "Birthday Bash" with role Promoter

  # ─────────────────────────────────────────────────────
  # Changing roles
  # ─────────────────────────────────────────────────────

  @AC-4 @BR-TEAM-007
  Scenario: Manager changes a team member's role from Promoter to Host
    Given "ana@example.com" is on the team of "Birthday Bash" as a Promoter
    When I change "ana@example.com"'s role to Host
    Then "ana@example.com" is on the team of "Birthday Bash" with role Host

  @AC-4 @BR-ROLE-005 @BR-TEAM-007
  Scenario: Manager promotes a Promoter to Manager
    Given "ana@example.com" is on the team of "Birthday Bash" as a Promoter
    When I change "ana@example.com"'s role to Manager
    Then "ana@example.com" is on the team of "Birthday Bash" with role Manager

  @AC-14 @BR-TEAM-006 @error
  Scenario: Demoting the only remaining Manager is rejected
    Given I am the only Manager of event "Birthday Bash"
    When I change my own role to Promoter
    Then I see the error "An event must have at least one Manager"
    And I remain a Manager of "Birthday Bash"

  @edge-case @EDGE-7 @BR-TEAM-006 @error
  Scenario: Manager cannot demote themselves while sole Manager
    Given I am the only Manager of event "Birthday Bash"
    When I attempt to change my own role to Host
    Then I see the error "An event must have at least one Manager"
    And I remain a Manager of "Birthday Bash"

  # ─────────────────────────────────────────────────────
  # Removing team members
  # ─────────────────────────────────────────────────────

  @AC-5
  Scenario: Manager removes a Promoter from the team
    Given "ana@example.com" is on the team of "Birthday Bash" as a Promoter
    When I remove "ana@example.com" from the team
    Then "ana@example.com" is no longer on the team of "Birthday Bash"
    And the team list does not include "ana@example.com"

  @AC-5
  Scenario: Manager removes a Host from the team
    Given "joao@example.com" is on the team of "Birthday Bash" as a Host
    When I remove "joao@example.com" from the team
    Then "joao@example.com" is no longer on the team of "Birthday Bash"

  @AC-13 @BR-TEAM-005 @error
  Scenario: Removing the original event creator is rejected
    Given the event creator of "Birthday Bash" is "pedro@example.com"
    And I am signed in as a Manager who is not the event creator
    When I remove "pedro@example.com" from the team
    Then I see the error "The event creator must remain a Manager"
    And "pedro@example.com" is still a Manager of "Birthday Bash"

  @AC-15 @BR-TEAM-006 @error
  Scenario: Removing the only remaining Manager is rejected
    Given I am the only Manager of event "Birthday Bash"
    And another Manager "maria@example.com" was previously removed
    When I attempt to remove myself from the team
    Then I see the error "You cannot remove yourself from the team"
    And I remain a Manager of "Birthday Bash"

  @AC-16 @BR-TEAM-004 @error
  Scenario: Manager cannot remove themselves
    Given another Manager "maria@example.com" is on the team of "Birthday Bash"
    When I attempt to remove myself from the team
    Then I see the error "You cannot remove yourself from the team"
    And I remain a Manager of "Birthday Bash"

  @edge-case @EDGE-3 @BR-TEAM-005
  Scenario: A promoted Manager has full rights but cannot remove the original creator
    Given the event creator of "Birthday Bash" is "pedro@example.com"
    And "ana@example.com" is on the team of "Birthday Bash" as a Manager
    And I am signed in as "ana@example.com"
    When I remove "pedro@example.com" from the team
    Then I see the error "The event creator must remain a Manager"
    And "pedro@example.com" is still a Manager of "Birthday Bash"

  @edge-case @EDGE-4
  Scenario: A removed Promoter no longer sees the event
    Given "ana@example.com" is on the team of "Birthday Bash" as a Promoter
    When I remove "ana@example.com" from the team
    And "ana@example.com" signs in and opens their events list
    Then "ana@example.com" does not see "Birthday Bash"

  # ─────────────────────────────────────────────────────
  # Listing team
  # ─────────────────────────────────────────────────────

  @AC-6
  Scenario: Manager views the team list for their event
    Given the team of "Birthday Bash" includes:
      | email             | role     |
      | ana@example.com   | Promoter |
      | joao@example.com  | Host     |
      | maria@example.com | Manager  |
    When I open the team list for "Birthday Bash"
    Then I see "ana@example.com" as a Promoter
    And I see "joao@example.com" as a Host
    And I see "maria@example.com" as a Manager

  # ─────────────────────────────────────────────────────
  # Role-based event visibility
  # ─────────────────────────────────────────────────────

  @AC-7 @BR-TEAM-008 @BR-ROLE-001
  Scenario: A Promoter sees events they are on
    Given an event "Warehouse Night" exists
    And "ana@example.com" is on the team of "Warehouse Night" as a Promoter
    When I am signed in as "ana@example.com"
    And I open my events list
    Then I see "Warehouse Night"
    And I can fetch "Warehouse Night" by id

  @AC-8 @BR-TEAM-008 @BR-ROLE-001
  Scenario: A Host sees events they are on
    Given an event "Sunset Sessions" exists
    And "joao@example.com" is on the team of "Sunset Sessions" as a Host
    When I am signed in as "joao@example.com"
    And I open my events list
    Then I see "Sunset Sessions"
    And I can fetch "Sunset Sessions" by id

  @AC-9 @BR-ROLE-004 @BR-TEAM-008 @edge-case @EDGE-1
  Scenario: A user with different roles on different events sees both with their correct role
    Given an event "Birthday Bash" exists
    And an event "Warehouse Night" exists
    And "ana@example.com" is on the team of "Birthday Bash" as a Promoter
    And "ana@example.com" is on the team of "Warehouse Night" as a Host
    When I am signed in as "ana@example.com"
    And I open my events list
    Then I see "Birthday Bash" with my role shown as Promoter
    And I see "Warehouse Night" with my role shown as Host

  @AC-18 @BR-TEAM-010 @edge-case @EDGE-5
  Scenario: Soft-deleting an event hides it from every team member
    Given the team of "Birthday Bash" includes:
      | email             | role     |
      | ana@example.com   | Promoter |
      | joao@example.com  | Host     |
    When I delete the event "Birthday Bash"
    And "ana@example.com" signs in and opens their events list
    Then "ana@example.com" does not see "Birthday Bash"
    And when "joao@example.com" signs in and opens their events list
    Then "joao@example.com" does not see "Birthday Bash"

  # ─────────────────────────────────────────────────────
  # Authorization
  # ─────────────────────────────────────────────────────

  @AC-12 @BR-TEAM-001 @error
  Scenario Outline: Non-Managers cannot manage the team
    Given event "Birthday Bash" exists
    And I am signed in as a <role> on "Birthday Bash"
    When I attempt to <action> on the team of "Birthday Bash"
    Then I see the error "You do not have permission to manage this event's team"
    And the team is unchanged

    Examples:
      | role     | action                                 |
      | Promoter | add "ana@example.com" as a Host        |
      | Promoter | remove "joao@example.com"              |
      | Promoter | change "joao@example.com"'s role       |
      | Host     | add "ana@example.com" as a Promoter    |
      | Host     | remove "ana@example.com"               |
      | Host     | change "ana@example.com"'s role        |

  @AC-12 @BR-TEAM-001 @error
  Scenario: A user not on the event's team cannot manage it
    Given event "Birthday Bash" exists
    And I am signed in as a user who is not on the team of "Birthday Bash"
    When I attempt to add "ana@example.com" to the team as a Promoter
    Then I see the error "You do not have permission to manage this event's team"
    And the team is unchanged

  @AC-17 @BR-TEAM-009 @BR-EVT-008 @error
  Scenario Outline: Promoters and Hosts on the team still cannot edit the event itself
    Given I am signed in as a <role> on "Birthday Bash"
    When I attempt to <action> the event
    Then I see the error "You do not have permission to edit this event"
    And the event is unchanged

    Examples:
      | role     | action  |
      | Promoter | update  |
      | Promoter | delete  |
      | Promoter | publish |
      | Host     | update  |
      | Host     | delete  |
      | Host     | cancel  |

  # ─────────────────────────────────────────────────────
  # Network errors
  # ─────────────────────────────────────────────────────

  @error
  Scenario: Network error during a team operation shows a generic message
    Given a user "ana@example.com" exists
    And the network is unavailable
    When I attempt to add "ana@example.com" to the team as a Promoter
    Then I see the error "Something went wrong. Please try again."
    And I remain on the current screen
