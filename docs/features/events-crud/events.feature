Feature: Events
  As a user of Event Queue
  I want to create and manage events through their full lifecycle
  So that I can run guest lists and door operations for each one

  Background:
    Given I am signed in as a user

  # ─────────────────────────────────────────────────────
  # Creating an event
  # ─────────────────────────────────────────────────────

  @AC-1 @BR-EVT-001 @BR-EVT-002
  Scenario: Create an event with a saved venue
    Given a venue "Club Astral" exists
    When I create an event with:
      | name      | Birthday Bash         |
      | startDate | 2026-06-12T22:00:00Z  |
      | venue     | Club Astral           |
    Then an event is created with status DRAFT
    And I am assigned as its Manager
    And the event's location is the venue "Club Astral"

  @AC-2 @BR-EVT-001 @BR-EVT-003
  Scenario: Create an event with an inline location
    When I create an event with:
      | name            | Warehouse Night       |
      | startDate       | 2026-06-20T22:00:00Z  |
      | locationName    | Galpão 88             |
      | locationAddress | Rua das Flores, 88    |
    Then an event is created with status DRAFT
    And I am assigned as its Manager
    And the event's location is the inline address "Galpão 88, Rua das Flores, 88"

  @AC-3 @BR-EVT-004
  Scenario: Omitting endDate defaults to startDate plus 12 hours
    When I create an event with:
      | name      | Default-End Test      |
      | startDate | 2026-06-12T22:00:00Z  |
      | venue     | Club Astral           |
    Then the event's endDate is "2026-06-13T10:00:00Z"

  @AC-4
  Scenario: Providing an explicit endDate is preserved
    When I create an event with:
      | name      | Custom-End Test       |
      | startDate | 2026-06-12T22:00:00Z  |
      | endDate   | 2026-06-13T06:00:00Z  |
      | venue     | Club Astral           |
    Then the event's endDate is "2026-06-13T06:00:00Z"

  @AC-5 @BR-EVT-002
  Scenario: Both venue and inline location — inline location is ignored
    Given a venue "Club Astral" exists
    When I create an event with:
      | name            | Mixed-Location Test   |
      | startDate       | 2026-06-12T22:00:00Z  |
      | venue           | Club Astral           |
      | locationName    | (ignored)             |
      | locationAddress | (ignored)             |
    Then the event's location is the venue "Club Astral"
    And the inline location fields are not stored

  @AC-6 @BR-EVT-001 @BR-EVT-003 @error
  Scenario: Neither venue nor inline location is rejected
    When I create an event with:
      | name      | Locationless         |
      | startDate | 2026-06-12T22:00:00Z |
    Then I see the error "Please select a venue or provide a location"
    And no event is created
    And I remain on the create-event form

  @AC-7 @BR-EVT-005 @error
  Scenario: endDate before startDate is rejected
    Given a venue "Club Astral" exists
    When I create an event with:
      | name      | Backwards-Dates       |
      | startDate | 2026-06-12T22:00:00Z  |
      | endDate   | 2026-06-12T20:00:00Z  |
      | venue     | Club Astral           |
    Then I see the error "End time must be after start time"
    And no event is created
    And I remain on the create-event form

  @AC-8 @BR-EVT-006 @error
  Scenario: startDate in the past is rejected at creation
    Given a venue "Club Astral" exists
    When I create an event with:
      | name      | Yesterday's Party     |
      | startDate | 2025-12-31T22:00:00Z  |
      | venue     | Club Astral           |
    Then I see the error "Start time cannot be in the past"
    And no event is created

  @error
  Scenario: Missing required event field is rejected
    Given a venue "Club Astral" exists
    When I create an event leaving the name empty
    Then I see the error "Please fill in all required fields"
    And no event is created
    And the empty fields are highlighted

  # ─────────────────────────────────────────────────────
  # Editing an event
  # ─────────────────────────────────────────────────────

  @AC-9 @BR-EVT-008
  Scenario: Manager edits their event
    Given I am the Manager of event "Birthday Bash"
    When I update the event with:
      | name        | Birthday Bash (Reloaded)        |
      | description | Reschedule because of weather   |
      | startDate   | 2026-06-19T22:00:00Z            |
    Then the event's name, description, and startDate reflect the changes

  @AC-9 @EDGE-2
  Scenario: Manager edits an event to set endDate in the past (historical correction)
    Given I am the Manager of event "Past-Correction"
    When I update the event's endDate to a moment in the past
    Then the update succeeds
    And the next read returns the event with status FINISHED

  # ─────────────────────────────────────────────────────
  # Status lifecycle
  # ─────────────────────────────────────────────────────

  @AC-10 @BR-STS-002
  Scenario: Manager publishes a DRAFT event
    Given I am the Manager of event "Birthday Bash" with status DRAFT
    When I publish the event
    Then the event's status is ACTIVE

  @AC-11 @BR-STS-003
  Scenario: Manager closes an ACTIVE event
    Given I am the Manager of event "Birthday Bash" with status ACTIVE
    When I close the event
    Then the event's status is FINISHED

  @AC-12 @BR-STS-004
  Scenario: Manager reopens a FINISHED event back to ACTIVE
    Given I am the Manager of event "Birthday Bash" with status FINISHED
    When I reopen the event
    Then the event's status is ACTIVE

  @AC-13 @BR-STS-005 @EDGE-3
  Scenario: Manager cancels a DRAFT event
    Given I am the Manager of event "Birthday Bash" with status DRAFT
    When I cancel the event
    Then the event's status is CANCELLED

  @AC-13 @BR-STS-006 @EDGE-3
  Scenario: Manager cancels an ACTIVE event
    Given I am the Manager of event "Birthday Bash" with status ACTIVE
    When I cancel the event
    Then the event's status is CANCELLED

  @AC-14 @BR-STS-007 @EDGE-4 @error
  Scenario: A CANCELLED event cannot be reopened
    Given I am the Manager of event "Birthday Bash" with status CANCELLED
    When I attempt to reopen the event
    Then I see the error "Cancelled events cannot be reopened."
    And the event's status remains CANCELLED

  @AC-14 @error
  Scenario Outline: Invalid status transitions are rejected
    Given I am the Manager of event "Birthday Bash" with status <from>
    When I attempt to transition the event to status <to>
    Then I see the error "This event cannot be changed to that status"
    And the event's status remains <from>

    Examples:
      | from     | to       |
      | DRAFT    | FINISHED |
      | FINISHED | DRAFT    |
      | ACTIVE   | DRAFT    |

  @AC-16 @BR-STS-008 @EDGE-1
  Scenario: Reading an ACTIVE event past its endDate auto-transitions to FINISHED
    Given I am the Manager of event "Birthday Bash" with status ACTIVE
    And the event's endDate has already passed
    When I view the event
    Then the event's status is reported as FINISHED

  # ─────────────────────────────────────────────────────
  # Deleting an event
  # ─────────────────────────────────────────────────────

  @AC-15 @BR-EVT-007
  Scenario: Manager soft-deletes their event
    Given I am the Manager of event "Birthday Bash"
    When I delete the event
    Then the event is no longer returned by my events list
    And the event is no longer fetchable by id
    And the event's deleted flag is set in storage

  @EDGE-6
  Scenario: Soft-deleting an event with team members (cascade deferred)
    Given I am the Manager of event "Big Night"
    And the event has team members assigned
    When I delete the event
    Then the event is excluded from all reads
    And team-member cascade behavior is deferred to the Team Management feature

  # ─────────────────────────────────────────────────────
  # Authorization
  # ─────────────────────────────────────────────────────

  @AC-17 @BR-EVT-008 @error
  Scenario Outline: Non-manager users cannot edit, delete, or transition an event
    Given event "Birthday Bash" exists
    And I am signed in as a different user who is not its Manager
    When I attempt to <action> the event
    Then I see the error "You do not have permission to edit this event"
    And the event is unchanged

    Examples:
      | action    |
      | update    |
      | delete    |
      | publish   |
      | close     |
      | cancel    |
      | reopen    |

  @error
  Scenario: Fetching a non-existent event returns Event not found
    When I open the detail screen for an unknown event id
    Then I see the error "Event not found"
    And I am redirected to the events list

  # ─────────────────────────────────────────────────────
  # Listing & reading
  # ─────────────────────────────────────────────────────

  @AC-18 @BR-EVT-009
  Scenario: User lists their own events
    Given I have created events "Birthday Bash" and "Warehouse Night"
    And another user has created event "Stranger's Party"
    When I open the events list
    Then I see "Birthday Bash" and "Warehouse Night"
    And I do not see "Stranger's Party"

  @AC-19 @BR-EVT-008
  Scenario: Manager fetches a single event by id
    Given I am the Manager of event "Birthday Bash"
    When I open the event's detail screen
    Then I see the event's full details

  @EDGE-10
  Scenario: Dates are stored and compared in UTC
    Given a venue "Club Astral" exists
    When I create an event with startDate "2026-06-12T22:00:00-03:00"
    Then the event's startDate is stored as "2026-06-13T01:00:00Z"
    And date validation uses UTC for comparisons

  @error
  Scenario: Network error during any operation shows a generic message
    Given the network is unavailable
    When I attempt to create, update, or transition an event
    Then I see the error "Something went wrong. Please try again."
    And I remain on the current screen
