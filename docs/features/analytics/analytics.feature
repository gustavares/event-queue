Feature: Analytics
  As a Manager of an event in Event Queue
  I want to see total check-ins, per-list breakdown, promoter performance, and door-sale revenue for that event
  So that I can review the night's outcome and reconcile the numbers

  Background:
    Given I am signed in as a Manager

  # ─────────────────────────────────────────────────────
  # Total check-ins
  # ─────────────────────────────────────────────────────

  @AC-1 @BR-ANL-002 @BR-ANL-003
  Scenario: Manager sees total check-ins for an event
    Given I am the Manager of event "Birthday Bash"
    And the event has 100 guests across all lists
    And 80 of those guests are checked in
    When I open the analytics view for event "Birthday Bash"
    Then I see total check-ins: 80

  # ─────────────────────────────────────────────────────
  # Per-list breakdown
  # ─────────────────────────────────────────────────────

  @AC-2 @BR-ANL-002 @BR-ANL-005 @BR-ANL-006
  Scenario: Manager sees per-list breakdown with rates
    Given I am the Manager of event "Birthday Bash"
    And the event has the following lists:
      | list name           | type      | guests on list | checked in |
      | VIP                 | OFFICIAL  | 20             | 18         |
      | Free before midnight| OFFICIAL  | 50             | 30         |
      | Marina's list       | PROMOTER  | 40             | 25         |
      | Pista (door)        | DOOR_SALES| 30             | 30         |
    When I open the analytics view for event "Birthday Bash"
    Then I see per-list breakdown:
      | list name           | type      | guests on list | checked in | check-in rate |
      | VIP                 | OFFICIAL  | 20             | 18         | 90%           |
      | Free before midnight| OFFICIAL  | 50             | 30         | 60%           |
      | Marina's list       | PROMOTER  | 40             | 25         | 62.5%         |
      | Pista (door)        | DOOR_SALES| 30             | 30         | 100%          |

  @AC-9 @BR-ANL-005 @BR-ANL-006 @edge-case @EDGE-5
  Scenario: A list with zero entries shows em dash for rate
    Given I am the Manager of event "Birthday Bash"
    And the event has the following lists:
      | list name      | type     | guests on list | checked in |
      | VIP            | OFFICIAL | 10             | 5          |
      | Empty Side List| OFFICIAL | 0              | 0          |
    When I open the analytics view for event "Birthday Bash"
    Then I see per-list breakdown:
      | list name      | type     | guests on list | checked in | check-in rate |
      | VIP            | OFFICIAL | 10             | 5          | 50%           |
      | Empty Side List| OFFICIAL | 0              | 0          | —             |

  # ─────────────────────────────────────────────────────
  # Promoter performance
  # ─────────────────────────────────────────────────────

  @AC-3 @BR-ANL-002 @BR-ANL-005 @BR-ANL-007
  Scenario: Manager sees promoter performance for every Promoter on the team
    Given I am the Manager of event "Birthday Bash"
    And the event has the following promoters and lists:
      | promoter | guests added | checked in |
      | Marina   | 40           | 25         |
      | Caio     | 20           | 10         |
      | Ana      | 50           | 50         |
    When I open the analytics view for event "Birthday Bash"
    Then I see promoter performance:
      | promoter | guests added | checked in | check-in rate |
      | Marina   | 40           | 25         | 62.5%         |
      | Caio     | 20           | 10         | 50%           |
      | Ana      | 50           | 50         | 100%          |

  @AC-10 @BR-ANL-007 @edge-case @EDGE-6
  Scenario: A promoter on the team who added no guests still appears with zero stats
    Given I am the Manager of event "Birthday Bash"
    And the event has the following promoters and lists:
      | promoter | guests added | checked in |
      | Marina   | 40           | 25         |
      | Idle Joe | 0            | 0          |
    When I open the analytics view for event "Birthday Bash"
    Then I see promoter performance:
      | promoter | guests added | checked in | check-in rate |
      | Marina   | 40           | 25         | 62.5%         |
      | Idle Joe | 0            | 0          | —             |

  # ─────────────────────────────────────────────────────
  # Door sales by tier
  # ─────────────────────────────────────────────────────

  @AC-4 @BR-ANL-002 @BR-ANL-009
  Scenario: Manager sees door sales by tier with sales count and revenue
    Given I am the Manager of event "Birthday Bash"
    And the event has door sales enabled
    And the event has tier "Pista" priced at 50.00 with 30 sales recorded
    And the event has tier "Camarote" priced at 150.00 with 8 sales recorded
    When I open the analytics view for event "Birthday Bash"
    Then I see door sales by tier:
      | tier     | price  | sales count | revenue |
      | Pista    | 50.00  | 30          | 1500.00 |
      | Camarote | 150.00 | 8           | 1200.00 |

  @AC-5 @BR-ANL-008 @edge-case @EDGE-2
  Scenario: Door-sales section is hidden when door sales are not enabled
    Given I am the Manager of event "Quiet Night"
    And the event has door sales disabled
    When I open the analytics view for event "Quiet Night"
    Then the door sales by tier section is not shown
    And I do not see the error "Door sales not enabled" treated as an error
    And the rest of the analytics view loads without errors

  # ─────────────────────────────────────────────────────
  # Permissions
  # ─────────────────────────────────────────────────────

  @AC-6 @BR-ANL-001 @error
  Scenario Outline: Non-Manager team members cannot view analytics
    Given event "Birthday Bash" exists
    And I am signed in as a <role> on event "Birthday Bash"
    When I attempt to open the analytics view for event "Birthday Bash"
    Then I see the error "You do not have permission to view analytics for this event"
    And no metrics are shown

    Examples:
      | role     |
      | Promoter |
      | Host     |

  @AC-6 @BR-ANL-001 @error
  Scenario: A user with no role on the event cannot view its analytics
    Given event "Birthday Bash" exists
    And I am signed in as a different user with no role on the event
    When I attempt to open the analytics view for event "Birthday Bash"
    Then I see the error "You do not have permission to view analytics for this event"
    And no metrics are shown

  # ─────────────────────────────────────────────────────
  # Zero-state and event status edge cases
  # ─────────────────────────────────────────────────────

  @AC-7 @BR-ANL-005 @edge-case @EDGE-1
  Scenario: Event with no check-ins yet shows all zeros without errors
    Given I am the Manager of event "Birthday Bash"
    And the event has 100 guests across all lists
    And 0 of those guests are checked in
    When I open the analytics view for event "Birthday Bash"
    Then I see total check-ins: 0
    And every per-list row shows checked in 0 and rate "—" or "0%"
    And every promoter row shows guests added 0 and rate "—"
    And no error is shown

  @AC-8 @BR-ANL-010 @edge-case @EDGE-3
  Scenario: Analytics are readable for a CANCELLED event
    Given I am the Manager of event "Cancelled Night"
    And the event has status CANCELLED
    And the event has 40 guests across all lists
    And 12 of those guests were checked in before cancellation
    When I open the analytics view for event "Cancelled Night"
    Then I see total check-ins: 12
    And no warning banner about cancellation is shown as an error

  @AC-8 @BR-ANL-010 @edge-case @EDGE-4
  Scenario: Analytics for a DRAFT event show all zeros
    Given I am the Manager of event "Draft Party"
    And the event has status DRAFT
    When I open the analytics view for event "Draft Party"
    Then I see total check-ins: 0
    And the per-list breakdown is empty or shows only system-created lists
    And the promoter performance table is empty or shows only assigned promoters with zero stats
    And no error is shown

  @AC-8 @BR-ANL-010 @edge-case @EDGE-7
  Scenario: Manager opens analytics while the event is still ACTIVE
    Given I am the Manager of event "Birthday Bash"
    And the event has status ACTIVE
    And the event has 100 guests across all lists
    And 42 of those guests are checked in so far
    When I open the analytics view for event "Birthday Bash"
    Then I see total check-ins: 42
    And the metrics reflect the current state at read time
    And no warning banner about the event being live is shown as an error

  # ─────────────────────────────────────────────────────
  # Cross-event scope guard
  # ─────────────────────────────────────────────────────

  @AC-11 @BR-ANL-004
  Scenario: There is no cross-event analytics dashboard in MVP
    Given I am signed in as a Manager
    And I have created multiple events
    When I look for a cross-event analytics dashboard
    Then no such view is exposed
    And I can only open analytics one event at a time

  # ─────────────────────────────────────────────────────
  # Generic errors
  # ─────────────────────────────────────────────────────

  @error
  Scenario: Manager opens analytics for a non-existent event
    Given I am signed in as a Manager
    When I open the analytics view for an unknown event id
    Then I see the error "Event not found"
    And I am redirected to the events list

  @error
  Scenario: Network error while loading analytics
    Given I am the Manager of event "Birthday Bash"
    And the network is unavailable
    When I open the analytics view for event "Birthday Bash"
    Then I see the error "Something went wrong. Please try again."
    And I remain on the analytics screen with a retry affordance
