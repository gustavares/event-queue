Feature: Venues
  As a user of Event Queue
  I want to save venues and reuse them across events
  So that I don't re-enter the same address for every event at the same place

  Background:
    Given I am signed in as a user

  # ─────────────────────────────────────────────────────
  # Creating a venue
  # ─────────────────────────────────────────────────────

  @AC-20 @BR-VEN-002 @BR-VEN-003
  Scenario: Create a venue with name and address
    When I create a venue with:
      | name    | Club Astral             |
      | address | Av. Paulista, 1000      |
    Then a venue "Club Astral" is created
    And the venue's capacity is unset

  @AC-21 @BR-VEN-003 @BR-VEN-004
  Scenario: Create a venue with name, address, and capacity
    When I create a venue with:
      | name     | Club Astral         |
      | address  | Av. Paulista, 1000  |
      | capacity | 500                 |
    Then a venue "Club Astral" is created
    And the venue's capacity is 500

  @AC-22 @BR-VEN-003 @error
  Scenario Outline: Missing name or address is rejected
    When I create a venue leaving <field> empty
    Then I see the error "Venue name and address are required"
    And no venue is created
    And I remain on the create-venue form

    Examples:
      | field   |
      | name    |
      | address |

  @AC-23 @BR-VEN-004 @error
  Scenario Outline: Non-positive capacity is rejected
    When I create a venue with:
      | name     | Club Astral         |
      | address  | Av. Paulista, 1000  |
      | capacity | <capacity>          |
    Then I see a validation error about capacity
    And no venue is created

    Examples:
      | capacity |
      | 0        |
      | -1       |

  # ─────────────────────────────────────────────────────
  # Listing & reading
  # ─────────────────────────────────────────────────────

  @AC-24 @BR-VEN-001
  Scenario: Any signed-in user can list every venue
    Given venues "Club Astral", "Galpão 88", and "Casa do Som" exist
    When I open the venue picker
    Then I see "Club Astral", "Galpão 88", and "Casa do Som"

  @AC-25 @BR-VEN-001
  Scenario: Any signed-in user can fetch a venue by id
    Given a venue "Club Astral" exists
    When I open the detail of "Club Astral"
    Then I see its name, address, and capacity

  # ─────────────────────────────────────────────────────
  # Edge cases
  # ─────────────────────────────────────────────────────

  @EDGE-8 @BR-VEN-005
  Scenario: Two venues may share the same name
    Given a venue named "Club Astral" exists
    When I create another venue named "Club Astral" with a different address
    Then both venues exist with distinct ids
    And the venue list shows both entries

  @EDGE-9
  Scenario: A user can pick a venue created by another user
    Given another user has created a venue "Casa do Som"
    When I open the venue picker
    Then I see "Casa do Som"
    And I can use it as the location for my own event
