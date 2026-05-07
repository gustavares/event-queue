Feature: Door-sales configuration
  As a Manager
  I want to enable door sales for an event and configure pricing tiers
  So that hosts can record walk-in entries at the right price

  Background:
    Given I am signed in as a user
    And I am the Manager of event "Birthday Bash"

  # ─────────────────────────────────────────────────────
  # Enabling and disabling door sales
  # ─────────────────────────────────────────────────────

  @AC-26 @BR-DSC-001
  Scenario: Manager enables door sales
    Given door sales are disabled for the event
    When I enable door sales
    Then door sales are reported as enabled for the event

  @AC-27 @BR-DSC-001 @BR-DSC-003
  Scenario: Manager disables door sales without losing tiers
    Given door sales are enabled for the event
    And the event has tiers "Pista R$50" and "Camarote R$150"
    When I disable door sales
    Then door sales are reported as disabled for the event
    And the tiers "Pista R$50" and "Camarote R$150" are still configured

  @AC-33 @BR-DSC-003 @EDGE-7
  Scenario: Re-enabling door sales restores existing tiers
    Given the event previously had tiers "Pista R$50" and "Camarote R$150"
    And door sales were disabled
    When I re-enable door sales
    Then the tiers "Pista R$50" and "Camarote R$150" are active again
    And no duplicate tiers are created

  # ─────────────────────────────────────────────────────
  # Tier management
  # ─────────────────────────────────────────────────────

  @AC-28 @BR-DSC-002
  Scenario: Manager adds a tier
    Given door sales are enabled for the event
    When I add a tier with:
      | name  | Pista |
      | price | 50.00 |
    Then the event has a tier "Pista" priced at 50.00

  @AC-29 @BR-DSC-002
  Scenario: Manager updates a tier's name and price
    Given the event has a tier "Pista" priced at 50.00
    When I update the tier with:
      | name  | Pista Premium |
      | price | 70.00         |
    Then the tier is renamed to "Pista Premium"
    And its price is 70.00

  @AC-30
  Scenario: Manager removes a tier
    Given the event has a tier "Camarote" priced at 150.00
    When I remove the "Camarote" tier
    Then the tier "Camarote" is no longer configured for the event

  @AC-32 @BR-DSC-002 @error
  Scenario Outline: Invalid tier values are rejected
    When I add a tier with:
      | name  | <name>  |
      | price | <price> |
    Then I see the error "Please provide a tier name and a price greater than zero"
    And no tier is added

    Examples:
      | name   | price |
      |        | 50.00 |
      | Pista  | 0     |
      | Pista  | -10   |
      | Pista  |       |

  # ─────────────────────────────────────────────────────
  # Authorization
  # ─────────────────────────────────────────────────────

  @AC-31 @BR-DSC-001 @error
  Scenario Outline: Non-managers cannot configure door sales
    Given I am signed in as a different user who is not the Manager
    When I attempt to <action>
    Then I see the error "You do not have permission to edit this event"
    And the event's door-sales configuration is unchanged

    Examples:
      | action                                     |
      | enable door sales                          |
      | disable door sales                         |
      | add a tier "Pista" priced at 50.00         |
      | update the tier "Pista"                    |
      | remove the tier "Pista"                    |
