Feature: Door sales recording
  As a Host at an event with door sales enabled
  I want to record walk-in entries by selecting a tier and capturing a document
  So that the venue has a verifiable record of every door sale

  Background:
    Given I am signed in as a Host
    And I am a Host on event "Birthday Bash"
    And event "Birthday Bash" is ACTIVE
    And event "Birthday Bash" has door sales enabled
    And event "Birthday Bash" has tier "Pista" priced at 50.00
    And event "Birthday Bash" has tier "Camarote" priced at 150.00

  # ─────────────────────────────────────────────────────
  # Happy path — recording a sale
  # ─────────────────────────────────────────────────────

  @AC-1 @BR-DSR-001 @BR-DSR-002 @BR-DSR-006 @BR-GST-005 @BR-GST-006
  Scenario: Host records a door sale with a CPF
    When I record a door sale with:
      | tier     | Pista       |
      | document | 12345678900 |
      | docType  | CPF         |
    Then a door-sale entry is recorded for "Pista" with document "12345678900"
    And the entry's recordedBy is me
    And the entry has a server timestamp

  @AC-2 @BR-DSR-002 @BR-GST-006
  Scenario: Host records a door sale with a Passport (foreign guest)
    When I record a door sale with:
      | tier     | Camarote |
      | document | FR123456 |
      | docType  | Passport |
    Then a door-sale entry is recorded for "Camarote" with document "FR123456"

  @AC-3 @BR-DSR-003
  Scenario: Host records a door sale with an optional guest name
    When I record a door sale with:
      | tier     | Pista        |
      | document | 12345678900  |
      | docType  | CPF          |
      | name     | Mariana Lima |
    Then a door-sale entry is recorded for "Pista" with document "12345678900"
    And the entry's guest name is "Mariana Lima"

  @AC-4 @BR-DSR-003
  Scenario: Host records a door sale without a guest name
    When I record a door sale with:
      | tier     | Pista       |
      | document | 12345678900 |
      | docType  | CPF         |
    Then a door-sale entry is recorded for "Pista" with document "12345678900"
    And the entry has no guest name

  @AC-5 @BR-DSR-001
  Scenario: Manager of the event records a door sale
    Given I am the Manager of event "Birthday Bash"
    When I record a door sale with:
      | tier     | Pista       |
      | document | 98765432100 |
      | docType  | CPF         |
    Then a door-sale entry is recorded for "Pista" with document "98765432100"
    And the entry's recordedBy is me

  # ─────────────────────────────────────────────────────
  # Recent feed
  # ─────────────────────────────────────────────────────

  @AC-6 @BR-DSR-008
  Scenario: New entry appears at the top of the recent feed
    Given the recent door-sales feed for "Birthday Bash" is empty
    When I record a door sale with:
      | tier     | Pista       |
      | document | 12345678900 |
      | docType  | CPF         |
    Then the recent door-sales feed for "Birthday Bash" shows my entry at the top

  @AC-7 @BR-DSR-008
  Scenario: Host views the recent door-sales feed with per-tier counts
    Given the following door sales have been recorded for "Birthday Bash":
      | tier     | document    | docType  | name           |
      | Pista    | 11111111111 | CPF      | Bruno Costa    |
      | Pista    | 22222222222 | CPF      | Camila Souza   |
      | Camarote | 33333333333 | CPF      | Diego Almeida  |
    When I view the recent door-sales feed for "Birthday Bash"
    Then I see 3 entries in chronological order, most recent first
    And I see the per-tier count "Pista: 2"
    And I see the per-tier count "Camarote: 1"

  @AC-8
  Scenario: Tier picker only shows tiers belonging to the current event
    Given another event "Other Night" has tier "Open Bar" priced at 200.00
    When I open the tier picker for "Birthday Bash"
    Then I see the tiers "Pista" and "Camarote"
    And I do not see the tier "Open Bar"

  # ─────────────────────────────────────────────────────
  # Event-state guards
  # ─────────────────────────────────────────────────────

  @AC-9 @BR-DSR-004 @error
  Scenario: Recording is blocked when door sales are disabled
    Given event "Birthday Bash" has door sales disabled
    When I record a door sale with:
      | tier     | Pista       |
      | document | 12345678900 |
      | docType  | CPF         |
    Then I see the error "Door sales are not enabled for this event"
    And no door-sale entry is recorded

  @AC-10 @BR-DSR-004 @error
  Scenario: Recording is blocked on a FINISHED event
    Given event "Birthday Bash" is FINISHED
    When I record a door sale with:
      | tier     | Pista       |
      | document | 12345678900 |
      | docType  | CPF         |
    Then I see the error "This event has ended"
    And no door-sale entry is recorded

  @AC-11 @BR-DSR-004 @error
  Scenario: Recording is blocked on a CANCELLED event
    Given event "Birthday Bash" is CANCELLED
    When I record a door sale with:
      | tier     | Pista       |
      | document | 12345678900 |
      | docType  | CPF         |
    Then I see the error "This event has been cancelled"
    And no door-sale entry is recorded

  @AC-12 @BR-DSR-004 @error
  Scenario: Recording is blocked on a DRAFT event
    Given event "Birthday Bash" is DRAFT
    When I record a door sale with:
      | tier     | Pista       |
      | document | 12345678900 |
      | docType  | CPF         |
    Then I see the error "This event has not started yet"
    And no door-sale entry is recorded

  # ─────────────────────────────────────────────────────
  # Authorization
  # ─────────────────────────────────────────────────────

  @AC-13 @BR-DSR-001 @error
  Scenario: User who is not on the event's team cannot record a sale
    Given I am signed in as a different user who is not on the event's team
    When I record a door sale with:
      | tier     | Pista       |
      | document | 12345678900 |
      | docType  | CPF         |
    Then I see the error "You do not have permission to record sales for this event"
    And no door-sale entry is recorded

  # ─────────────────────────────────────────────────────
  # Form validation
  # ─────────────────────────────────────────────────────

  @AC-14 @BR-DSR-002 @BR-GST-005 @error
  Scenario: Recording is blocked when document is missing
    When I record a door sale with:
      | tier     | Pista |
      | document |       |
      | docType  | CPF   |
    Then I see the error "Document is required for door sales"
    And no door-sale entry is recorded

  @AC-15 @BR-GST-006 @error
  Scenario Outline: Recording is blocked when the document format is invalid
    When I record a door sale with:
      | tier     | Pista       |
      | document | <document>  |
      | docType  | <docType>   |
    Then I see the error "Please enter a valid CPF or passport number"
    And no door-sale entry is recorded

    Examples:
      | document     | docType  |
      | 123          | CPF      |
      | 00000000000  | CPF      |
      | abc!@#       | Passport |

  @AC-16 @BR-DSR-002 @error
  Scenario: Recording is blocked when no tier is selected
    When I record a door sale with:
      | tier     |             |
      | document | 12345678900 |
      | docType  | CPF         |
    Then I see the error "Please select a tier"
    And no door-sale entry is recorded

  @AC-17 @BR-DSR-005 @error
  Scenario: Recording is blocked when the selected tier belongs to another event
    Given another event "Other Night" has tier "Open Bar" priced at 200.00
    When I attempt to record a door sale on "Birthday Bash" using the tier "Open Bar" from "Other Night"
    Then I see the error "Selected tier is not available for this event"
    And no door-sale entry is recorded

  @AC-18 @error @edge-case @EDGE-7
  Scenario: Door sales enabled but no tiers configured
    Given event "Birthday Bash" has door sales enabled
    And event "Birthday Bash" has no tiers configured
    When I open the door-sales recording screen for "Birthday Bash"
    Then the tier picker is empty
    And I see the message "No tiers configured. Ask the manager to add tiers before recording sales."
    And the submit action is disabled

  # ─────────────────────────────────────────────────────
  # Allowed-by-design behaviors
  # ─────────────────────────────────────────────────────

  @AC-19 @BR-DSR-007 @edge-case @EDGE-4
  Scenario: Same document recorded twice on the same event is allowed
    When I record a door sale with:
      | tier     | Pista       |
      | document | 12345678900 |
      | docType  | CPF         |
    And I record a door sale with:
      | tier     | Pista       |
      | document | 12345678900 |
      | docType  | CPF         |
    Then 2 door-sale entries are recorded for "Pista" with document "12345678900"
    And both entries have independent timestamps

  @edge-case @EDGE-5 @BR-DSR-007
  Scenario: Same document recorded on the same event under different tiers is allowed
    When I record a door sale with:
      | tier     | Pista       |
      | document | 12345678900 |
      | docType  | CPF         |
    And I record a door sale with:
      | tier     | Camarote    |
      | document | 12345678900 |
      | docType  | CPF         |
    Then a door-sale entry is recorded for "Pista" with document "12345678900"
    And a door-sale entry is recorded for "Camarote" with document "12345678900"

  @edge-case @EDGE-6 @BR-DSR-001
  Scenario: A user who is both Host and Manager on the event can record sales
    Given I am also the Manager of event "Birthday Bash"
    When I record a door sale with:
      | tier     | Pista       |
      | document | 12345678900 |
      | docType  | CPF         |
    Then a door-sale entry is recorded for "Pista" with document "12345678900"

  # ─────────────────────────────────────────────────────
  # Mid-form state changes
  # ─────────────────────────────────────────────────────

  @edge-case @EDGE-1 @error
  Scenario: Event auto-transitions to FINISHED while the host is mid-form
    Given I have the door-sales recording form open for "Birthday Bash"
    And event "Birthday Bash" auto-transitions to FINISHED because its end time passes
    When I submit the door sale with:
      | tier     | Pista       |
      | document | 12345678900 |
      | docType  | CPF         |
    Then I see the error "This event has ended"
    And no door-sale entry is recorded

  @edge-case @EDGE-2 @error
  Scenario: Manager disables door sales while the host is mid-form
    Given I have the door-sales recording form open for "Birthday Bash"
    And the Manager disables door sales for "Birthday Bash"
    When I submit the door sale with:
      | tier     | Pista       |
      | document | 12345678900 |
      | docType  | CPF         |
    Then I see the error "Door sales are not enabled for this event"
    And no door-sale entry is recorded

  @edge-case @EDGE-3 @error
  Scenario: Manager removes the selected tier while the host is mid-form
    Given I have the door-sales recording form open for "Birthday Bash" with tier "Pista" selected
    And the Manager removes the tier "Pista" from "Birthday Bash"
    When I submit the door sale with:
      | tier     | Pista       |
      | document | 12345678900 |
      | docType  | CPF         |
    Then I see the error "Selected tier is not available for this event"
    And no door-sale entry is recorded
