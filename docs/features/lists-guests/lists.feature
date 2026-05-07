Feature: Lists
  As a Manager, Promoter, or Host on an event
  I want to create, rename, delete, and view the lists that organize an event's guests
  So that the door knows who is expected and which promoter brought them

  Background:
    Given I am signed in
    And the event "Birthday Bash" exists with status ACTIVE

  # ─────────────────────────────────────────────────────
  # Creating a list
  # ─────────────────────────────────────────────────────

  @AC-1 @BR-LST-001 @BR-LST-002
  Scenario: Manager creates an OFFICIAL list
    Given I am the Manager of event "Birthday Bash"
    When I create a list on event "Birthday Bash" with:
      | name | VIP      |
      | type | OFFICIAL |
    Then a list "VIP" is created on event "Birthday Bash"
    And the list's type is OFFICIAL
    And the list is attributed to me as its creator

  @AC-2 @BR-LST-001 @BR-LST-003
  Scenario: Promoter creates a PROMOTER list
    Given I am a Promoter on event "Birthday Bash"
    When I create a list on event "Birthday Bash" with:
      | name | Ana's Crew |
      | type | PROMOTER   |
    Then a list "Ana's Crew" is created on event "Birthday Bash"
    And the list's type is PROMOTER
    And the list is owned by me as its Promoter

  @AC-1 @AC-2 @BR-LST-001
  Scenario Outline: List creation by role and type
    Given I am signed in as a <role> on event "Birthday Bash"
    When I create a list on event "Birthday Bash" with:
      | name | <name> |
      | type | <type> |
    Then a list "<name>" of type <type> is created on event "Birthday Bash"

    Examples:
      | role     | name                 | type     |
      | Manager  | Free before midnight | OFFICIAL |
      | Manager  | Aniversariantes      | OFFICIAL |
      | Promoter | Pedro's Guests       | PROMOTER |
      | Promoter | Camila VIPs          | PROMOTER |

  @AC-3 @BR-LST-005 @error
  Scenario Outline: Empty or whitespace-only list name is rejected
    Given I am the Manager of event "Birthday Bash"
    When I attempt to create a list on event "Birthday Bash" with name "<name>" and type OFFICIAL
    Then I see the error "Please provide a list name"
    And no list is created
    And I remain on the create-list form

    Examples:
      | name |
      |      |
      |  |

  @AC-4 @EDGE-1 @BR-LST-005
  Scenario: Two lists on the same event may share a name
    Given I am the Manager of event "Birthday Bash"
    And the list "VIP" exists for event "Birthday Bash"
    When I create a list on event "Birthday Bash" with:
      | name | VIP      |
      | type | OFFICIAL |
    Then both lists named "VIP" exist on event "Birthday Bash"
    And both lists have distinct ids

  @AC-13 @BR-LST-009 @error
  Scenario: Creating a DOOR_SALES list from this feature is rejected
    Given I am the Manager of event "Birthday Bash"
    When I attempt to create a list on event "Birthday Bash" with:
      | name | Pista    |
      | type | DOOR_SALES |
    Then I see the error "Door-sale lists are managed by door-sales settings"
    And no list is created

  @AC-17 @BR-LST-014 @error
  Scenario Outline: Creating a list on a closed event is rejected
    Given I am the Manager of event "Old Party" with status <status>
    When I attempt to create a list on event "Old Party" with:
      | name | VIP      |
      | type | OFFICIAL |
    Then I see the error "This event is closed and can no longer be edited"
    And no list is created

    Examples:
      | status    |
      | FINISHED  |
      | CANCELLED |

  @AC-18 @BR-LST-011 @BR-LST-012 @BR-LST-013 @error
  Scenario: User with no role on the event cannot create a list
    Given I have no role on event "Birthday Bash"
    When I attempt to create a list on event "Birthday Bash" with:
      | name | VIP      |
      | type | OFFICIAL |
    Then I see the error "You do not have permission to view this event"
    And no list is created

  # ─────────────────────────────────────────────────────
  # Renaming a list
  # ─────────────────────────────────────────────────────

  @AC-5 @BR-LST-006
  Scenario: Manager renames their OFFICIAL list
    Given I am the Manager of event "Birthday Bash"
    And the list "VIP" exists for event "Birthday Bash" with type OFFICIAL
    When I rename the list "VIP" to "VIP Camarote"
    Then the list is renamed to "VIP Camarote"
    And the list's type remains OFFICIAL

  @AC-6 @BR-LST-006
  Scenario: Promoter renames their own PROMOTER list
    Given I am a Promoter on event "Birthday Bash"
    And I own the list "Ana's Crew" for event "Birthday Bash" with type PROMOTER
    When I rename the list "Ana's Crew" to "Ana's VIPs"
    Then the list is renamed to "Ana's VIPs"

  @AC-7 @BR-LST-006 @error
  Scenario: A different Promoter cannot rename someone else's PROMOTER list
    Given the list "Pedro's Guests" exists for event "Birthday Bash" with type PROMOTER owned by Promoter "Pedro"
    And I am a Promoter on event "Birthday Bash" but I am not Pedro
    When I attempt to rename the list "Pedro's Guests" to "Stolen List"
    Then I see the error "You do not have permission to edit this list"
    And the list's name remains "Pedro's Guests"

  @AC-7 @BR-LST-006 @error
  Scenario: A Promoter cannot rename an OFFICIAL list
    Given I am a Promoter on event "Birthday Bash"
    And the list "VIP" exists for event "Birthday Bash" with type OFFICIAL
    When I attempt to rename the list "VIP" to "Promoter VIP"
    Then I see the error "You do not have permission to edit this list"
    And the list's name remains "VIP"

  @AC-13 @BR-LST-009 @error
  Scenario: Renaming a DOOR_SALES list is rejected
    Given I am the Manager of event "Birthday Bash"
    And a DOOR_SALES list "Pista" exists on event "Birthday Bash"
    When I attempt to rename the list "Pista" to "Pista VIP"
    Then I see the error "Door-sale lists are managed by door-sales settings"
    And the list's name remains "Pista"

  @AC-17 @BR-LST-014 @error
  Scenario: Renaming a list on a CANCELLED event is rejected
    Given I am the Manager of event "Old Party" with status CANCELLED
    And the list "VIP" exists for event "Old Party"
    When I attempt to rename the list "VIP" to "VIP Reloaded"
    Then I see the error "This event is closed and can no longer be edited"
    And the list's name remains "VIP"

  # ─────────────────────────────────────────────────────
  # Deleting a list
  # ─────────────────────────────────────────────────────

  @AC-8 @BR-LST-008 @BR-LST-010
  Scenario: Manager deletes an empty OFFICIAL list
    Given I am the Manager of event "Birthday Bash"
    And the list "VIP" exists for event "Birthday Bash" with type OFFICIAL
    And the list "VIP" has no entries
    When I delete the list "VIP"
    Then the list "VIP" no longer exists on event "Birthday Bash"

  @AC-9 @BR-LST-008 @BR-LST-010
  Scenario: Promoter deletes their own empty PROMOTER list
    Given I am a Promoter on event "Birthday Bash"
    And I own the list "Ana's Crew" for event "Birthday Bash"
    And the list "Ana's Crew" has no entries
    When I delete the list "Ana's Crew"
    Then the list "Ana's Crew" no longer exists on event "Birthday Bash"

  @AC-10 @EDGE-2 @BR-LST-010
  Scenario: Deleting a list cascades its PENDING entries
    Given I am a Promoter on event "Birthday Bash"
    And I own the list "Ana's Crew" for event "Birthday Bash"
    And the list "Ana's Crew" has entries for guests "João Silva", "Maria Souza", and "Bruno Rocha", all with status PENDING
    When I delete the list "Ana's Crew"
    Then the list "Ana's Crew" no longer exists on event "Birthday Bash"
    And the entries for "João Silva", "Maria Souza", and "Bruno Rocha" no longer exist
    And the QR codes for those entries are no longer valid

  @AC-11 @BR-LST-010 @error
  Scenario: Deleting a list with a CHECKED_IN entry is rejected
    Given I am the Manager of event "Birthday Bash"
    And the list "VIP" exists for event "Birthday Bash"
    And guest "Fernanda Lima" is on list "VIP" with status CHECKED_IN
    When I attempt to delete the list "VIP"
    Then I see the error "This list has guests who have already checked in and cannot be deleted"
    And the list "VIP" still exists
    And guest "Fernanda Lima" is still on list "VIP" with status CHECKED_IN

  @AC-12 @BR-LST-008 @error
  Scenario: A different Promoter cannot delete someone else's PROMOTER list
    Given the list "Pedro's Guests" exists for event "Birthday Bash" with type PROMOTER owned by Promoter "Pedro"
    And I am a Promoter on event "Birthday Bash" but I am not Pedro
    When I attempt to delete the list "Pedro's Guests"
    Then I see the error "You do not have permission to edit this list"
    And the list "Pedro's Guests" still exists

  @AC-12 @BR-LST-008 @error
  Scenario: A Promoter cannot delete an OFFICIAL list
    Given I am a Promoter on event "Birthday Bash"
    And the list "VIP" exists for event "Birthday Bash" with type OFFICIAL
    When I attempt to delete the list "VIP"
    Then I see the error "You do not have permission to edit this list"
    And the list "VIP" still exists

  @AC-13 @BR-LST-009 @error
  Scenario: Deleting a DOOR_SALES list from this feature is rejected
    Given I am the Manager of event "Birthday Bash"
    And a DOOR_SALES list "Pista" exists on event "Birthday Bash"
    When I attempt to delete the list "Pista"
    Then I see the error "Door-sale lists are managed by door-sales settings"
    And the list "Pista" still exists

  @EDGE-7 @edge-case
  Scenario: Promoter removed from team while owning a PROMOTER list with entries
    Given Promoter "Pedro" owns the list "Pedro's Guests" on event "Birthday Bash"
    And the list "Pedro's Guests" has entries for guests "Bruno Rocha" and "Camila Ferraz"
    When Promoter "Pedro" is removed from the team of event "Birthday Bash"
    Then the cascade of "Pedro's Guests" and its entries is delegated to the Team Management feature
    And no behavior in this feature changes the list or its entries

  @EDGE-3 @BR-LST-010
  Scenario: Manager deletes an OFFICIAL list while a Host is viewing it
    Given I am the Manager of event "Birthday Bash"
    And the list "VIP" exists for event "Birthday Bash" with type OFFICIAL
    And the list "VIP" has no entries
    And a Host is currently viewing the list "VIP"
    When I delete the list "VIP"
    Then the list "VIP" no longer exists on event "Birthday Bash"
    And the Host's next read of the list returns no list

  # ─────────────────────────────────────────────────────
  # Listing & reading
  # ─────────────────────────────────────────────────────

  @AC-14 @BR-LST-011
  Scenario: Manager sees every list on their event
    Given I am the Manager of event "Birthday Bash"
    And event "Birthday Bash" has door sales enabled with tiers "Pista" and "Camarote"
    And the lists "VIP" and "Aniversariantes" exist for event "Birthday Bash" with type OFFICIAL
    And Promoter "Ana" owns the list "Ana's Crew" on event "Birthday Bash"
    And Promoter "Pedro" owns the list "Pedro's Guests" on event "Birthday Bash"
    When I open the lists overview for event "Birthday Bash"
    Then I see the lists "VIP", "Aniversariantes", "Ana's Crew", "Pedro's Guests", "Pista", and "Camarote"

  @AC-14 @BR-LST-011
  Scenario: Manager sees no DOOR_SALES lists when door sales are disabled
    Given I am the Manager of event "Birthday Bash"
    And event "Birthday Bash" has door sales disabled
    And the list "VIP" exists for event "Birthday Bash" with type OFFICIAL
    When I open the lists overview for event "Birthday Bash"
    Then I see the list "VIP"
    And I do not see any DOOR_SALES lists

  @AC-15 @BR-LST-012
  Scenario: Promoter sees only their own lists on the event
    Given I am a Promoter on event "Birthday Bash" identified as "Ana"
    And I own the lists "Ana's Crew" and "Ana's VIPs" on event "Birthday Bash"
    And Promoter "Pedro" owns the list "Pedro's Guests" on event "Birthday Bash"
    And the list "VIP" exists for event "Birthday Bash" with type OFFICIAL
    When I open the lists overview for event "Birthday Bash"
    Then I see the lists "Ana's Crew" and "Ana's VIPs"
    And I do not see "Pedro's Guests"
    And I do not see "VIP"

  @AC-16 @BR-LST-013
  Scenario: Host sees every list on events where they are assigned
    Given I am a Host on event "Birthday Bash"
    And event "Birthday Bash" has door sales enabled with tier "Pista"
    And the list "VIP" exists for event "Birthday Bash" with type OFFICIAL
    And Promoter "Ana" owns the list "Ana's Crew" on event "Birthday Bash"
    When I open the lists overview for event "Birthday Bash"
    Then I see the lists "VIP", "Ana's Crew", and "Pista"

  @AC-18 @BR-LST-011 @BR-LST-012 @BR-LST-013 @error
  Scenario: User with no role on the event cannot read its lists
    Given I have no role on event "Birthday Bash"
    When I attempt to open the lists overview for event "Birthday Bash"
    Then I see the error "You do not have permission to view this event"
    And no lists are returned

  # ─────────────────────────────────────────────────────
  # Network errors
  # ─────────────────────────────────────────────────────

  @error
  Scenario: Network error during a list operation shows a generic message
    Given I am the Manager of event "Birthday Bash"
    And the network is unavailable
    When I attempt to create, rename, or delete a list on event "Birthday Bash"
    Then I see the error "Something went wrong. Please try again."
    And I remain on the current screen
