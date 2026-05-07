Feature: Guests & List Entries
  As a Manager or Promoter on an event
  I want to add, view, edit, and remove guest entries on the lists I own
  So that the door has an accurate roster of who is expected and who brought them

  Background:
    Given I am signed in
    And the event "Birthday Bash" exists with status ACTIVE

  # ─────────────────────────────────────────────────────
  # Adding a guest
  # ─────────────────────────────────────────────────────

  @AC-19 @BR-GST-001 @BR-GST-002 @BR-GST-008
  Scenario: Promoter adds a guest with name only to their own list
    Given I am a Promoter on event "Birthday Bash"
    And I own the list "Ana's Crew" for event "Birthday Bash"
    When I add a guest to list "Ana's Crew" with:
      | name | João Silva |
    Then a guest "João Silva" is created
    And a list entry for "João Silva" is added to list "Ana's Crew"
    And the entry has a unique QR code
    And the entry's status is PENDING

  @AC-20 @BR-GST-001 @BR-GST-007
  Scenario: Promoter adds a guest with full contact info
    Given I am a Promoter on event "Birthday Bash"
    And I own the list "Ana's Crew" for event "Birthday Bash"
    When I add a guest to list "Ana's Crew" with:
      | name  | Maria Souza        |
      | email | maria@example.com  |
      | phone | +5511999990000     |
    Then a guest "Maria Souza" is created with email "maria@example.com" and phone "+5511999990000"
    And a list entry for "Maria Souza" is added to list "Ana's Crew" with status PENDING

  @AC-21 @BR-GST-004 @BR-GST-006
  Scenario Outline: Promoter adds a guest with an optional document
    Given I am a Promoter on event "Birthday Bash"
    And I own the list "Ana's Crew" for event "Birthday Bash"
    When I add a guest to list "Ana's Crew" with:
      | name           | <name>     |
      | documentType   | <docType>  |
      | documentNumber | <docNumber> |
    Then a guest "<name>" is created with documentType <docType> and documentNumber "<docNumber>"
    And a list entry for "<name>" is added to list "Ana's Crew"

    Examples:
      | name           | docType  | docNumber       |
      | Bruno Rocha    | CPF      | 123.456.789-09  |
      | Camila Ferraz  | PASSPORT | FR1234567       |

  @AC-21 @BR-GST-004
  Scenario: Promoter adds a guest without a document
    Given I am a Promoter on event "Birthday Bash"
    And I own the list "Ana's Crew" for event "Birthday Bash"
    When I add a guest to list "Ana's Crew" with:
      | name | Pedro Almeida |
    Then a guest "Pedro Almeida" is created with no document
    And a list entry for "Pedro Almeida" is added to list "Ana's Crew" with status PENDING

  @AC-22 @BR-GST-002 @BR-GST-010
  Scenario: Manager adds a guest to an OFFICIAL list
    Given I am the Manager of event "Birthday Bash"
    And the list "VIP" exists for event "Birthday Bash" with type OFFICIAL
    When I add a guest to list "VIP" with:
      | name | Fernanda Lima |
    Then a guest "Fernanda Lima" is created
    And a list entry for "Fernanda Lima" is added to list "VIP"
    And the entry is attributed to me as its creator

  @AC-23 @BR-GST-007 @error
  Scenario Outline: Empty or whitespace-only guest name is rejected
    Given I am a Promoter on event "Birthday Bash"
    And I own the list "Ana's Crew" for event "Birthday Bash"
    When I attempt to add a guest to list "Ana's Crew" with name "<name>"
    Then I see the error "Please provide a guest name"
    And no guest is created
    And no entry is added to list "Ana's Crew"

    Examples:
      | name |
      |      |
      |  |

  @AC-24 @BR-GST-006 @error
  Scenario Outline: Invalid CPF format is rejected
    Given I am a Promoter on event "Birthday Bash"
    And I own the list "Ana's Crew" for event "Birthday Bash"
    When I attempt to add a guest to list "Ana's Crew" with:
      | name           | João Silva |
      | documentType   | CPF        |
      | documentNumber | <cpf>      |
    Then I see the error "Please enter a valid CPF"
    And no guest is created
    And no entry is added to list "Ana's Crew"

    Examples:
      | cpf            |
      | 123            |
      | 111.111.111-11 |
      | abcdefghijk    |

  @AC-25 @BR-GST-006 @error
  Scenario: Unsupported document type is rejected
    Given I am a Promoter on event "Birthday Bash"
    And I own the list "Ana's Crew" for event "Birthday Bash"
    When I attempt to add a guest to list "Ana's Crew" with:
      | name           | João Silva |
      | documentType   | RG         |
      | documentNumber | 12.345.678 |
    Then I see the error "Document must be a CPF or a Passport"
    And no guest is created

  @AC-26 @EDGE-4 @BR-GST-003 @BR-GST-012
  Scenario: Same person added to two different lists yields two independent entries
    Given Promoter "Ana" owns the list "Ana's Crew" on event "Birthday Bash"
    And Promoter "Pedro" owns the list "Pedro's Guests" on event "Birthday Bash"
    When Promoter "Ana" adds a guest to list "Ana's Crew" with:
      | name           | João Silva     |
      | documentType   | CPF            |
      | documentNumber | 123.456.789-09 |
    And Promoter "Pedro" adds a guest to list "Pedro's Guests" with:
      | name           | João Silva     |
      | documentType   | CPF            |
      | documentNumber | 123.456.789-09 |
    Then list "Ana's Crew" has an entry for "João Silva"
    And list "Pedro's Guests" has an entry for "João Silva"
    And the two entries have distinct QR codes
    And the two entries have independent check-in statuses
    And promoter credit for each entry is tracked separately

  @AC-27 @BR-GST-014
  Scenario: Adding a guest with contact info triggers a notification
    Given I am a Promoter on event "Birthday Bash"
    And I own the list "Ana's Crew" for event "Birthday Bash"
    When I add a guest to list "Ana's Crew" with:
      | name  | Maria Souza        |
      | email | maria@example.com  |
      | phone | +5511999990000     |
    Then a list entry for "Maria Souza" is added to list "Ana's Crew"
    And a notification dispatch is triggered for "Maria Souza" with the entry's QR code

  @EDGE-5
  Scenario: Adding a guest without contact info dispatches no notification
    Given I am a Promoter on event "Birthday Bash"
    And I own the list "Ana's Crew" for event "Birthday Bash"
    When I add a guest to list "Ana's Crew" with:
      | name | João Silva |
    Then a list entry for "João Silva" is added to list "Ana's Crew"
    And no notification dispatch is triggered

  @EDGE-6 @BR-GST-014
  Scenario: Guest with only a phone number still triggers a notification
    Given I am a Promoter on event "Birthday Bash"
    And I own the list "Ana's Crew" for event "Birthday Bash"
    When I add a guest to list "Ana's Crew" with:
      | name  | Bruno Rocha    |
      | phone | +5511988880000 |
    Then a list entry for "Bruno Rocha" is added to list "Ana's Crew"
    And a notification dispatch is triggered for "Bruno Rocha"

  @AC-31 @BR-GST-009 @error
  Scenario: A different Promoter cannot add to someone else's PROMOTER list
    Given the list "Pedro's Guests" exists for event "Birthday Bash" with type PROMOTER owned by Promoter "Pedro"
    And I am a Promoter on event "Birthday Bash" but I am not Pedro
    When I attempt to add a guest to list "Pedro's Guests" with name "João Silva"
    Then I see the error "You do not have permission to edit this list"
    And no guest is created
    And no entry is added to list "Pedro's Guests"

  @AC-31 @BR-GST-009 @error
  Scenario: A Promoter cannot add to an OFFICIAL list
    Given I am a Promoter on event "Birthday Bash"
    And the list "VIP" exists for event "Birthday Bash" with type OFFICIAL
    When I attempt to add a guest to list "VIP" with name "João Silva"
    Then I see the error "You do not have permission to edit this list"
    And no entry is added to list "VIP"

  @AC-36 @BR-LST-014 @error
  Scenario Outline: Adding a guest on a closed event is rejected
    Given I am a Promoter on event "Old Party" with status <status>
    And I own the list "Ana's Crew" on event "Old Party"
    When I attempt to add a guest to list "Ana's Crew" with name "João Silva"
    Then I see the error "This event is closed and can no longer be edited"
    And no guest is added

    Examples:
      | status    |
      | FINISHED  |
      | CANCELLED |

  @AC-37 @error
  Scenario: User with no role on the event cannot add to its lists
    Given I have no role on event "Birthday Bash"
    And the list "VIP" exists for event "Birthday Bash"
    When I attempt to add a guest to list "VIP" with name "João Silva"
    Then I see the error "You do not have permission to view this event"
    And no entry is added to list "VIP"

  # ─────────────────────────────────────────────────────
  # Removing an entry
  # ─────────────────────────────────────────────────────

  @AC-28 @BR-GST-009
  Scenario: Promoter removes a PENDING entry from their own list
    Given I am a Promoter on event "Birthday Bash"
    And I own the list "Ana's Crew" for event "Birthday Bash"
    And guest "João Silva" is on list "Ana's Crew" with status PENDING
    When I remove the entry for "João Silva" from list "Ana's Crew"
    Then the entry for "João Silva" is no longer on list "Ana's Crew"
    And the QR code for that entry is no longer valid

  @AC-29 @BR-GST-010
  Scenario: Manager removes a PENDING entry from any list on their event
    Given I am the Manager of event "Birthday Bash"
    And the list "Pedro's Guests" exists for event "Birthday Bash" with type PROMOTER owned by Promoter "Pedro"
    And guest "Bruno Rocha" is on list "Pedro's Guests" with status PENDING
    When I remove the entry for "Bruno Rocha" from list "Pedro's Guests"
    Then the entry for "Bruno Rocha" is no longer on list "Pedro's Guests"

  @AC-30 @EDGE-8 @BR-GST-011 @error
  Scenario: Removing a CHECKED_IN entry is rejected
    Given I am the Manager of event "Birthday Bash"
    And guest "Fernanda Lima" is on list "VIP" with status CHECKED_IN
    When I attempt to remove the entry for "Fernanda Lima" from list "VIP"
    Then I see the error "This guest has already checked in and cannot be removed"
    And the entry for "Fernanda Lima" is still on list "VIP" with status CHECKED_IN

  @EDGE-8 @BR-GST-003
  Scenario: Removing one entry preserves the Guest record referenced by another entry
    Given Promoter "Ana" owns the list "Ana's Crew" on event "Birthday Bash"
    And Promoter "Pedro" owns the list "Pedro's Guests" on event "Birthday Bash"
    And guest "João Silva" with CPF "123.456.789-09" is on list "Ana's Crew" with status PENDING
    And guest "João Silva" with CPF "123.456.789-09" is on list "Pedro's Guests" with status PENDING
    When Promoter "Ana" removes the entry for "João Silva" from list "Ana's Crew"
    Then the entry for "João Silva" is no longer on list "Ana's Crew"
    And the entry for "João Silva" on list "Pedro's Guests" is unchanged
    And the QR code for the removed entry is no longer valid
    And the QR code for the surviving entry on "Pedro's Guests" is still valid

  @AC-31 @BR-GST-009 @error
  Scenario: A different Promoter cannot remove an entry from someone else's list
    Given the list "Pedro's Guests" exists for event "Birthday Bash" with type PROMOTER owned by Promoter "Pedro"
    And guest "Bruno Rocha" is on list "Pedro's Guests" with status PENDING
    And I am a Promoter on event "Birthday Bash" but I am not Pedro
    When I attempt to remove the entry for "Bruno Rocha" from list "Pedro's Guests"
    Then I see the error "You do not have permission to edit this list"
    And the entry for "Bruno Rocha" is still on list "Pedro's Guests"

  @AC-36 @BR-LST-014 @error
  Scenario: Removing an entry on a CANCELLED event is rejected
    Given I am the Manager of event "Old Party" with status CANCELLED
    And guest "Maria Souza" is on list "VIP" with status PENDING
    When I attempt to remove the entry for "Maria Souza" from list "VIP"
    Then I see the error "This event is closed and can no longer be edited"
    And the entry for "Maria Souza" is still on list "VIP"

  # ─────────────────────────────────────────────────────
  # Editing an entry's guest fields
  # ─────────────────────────────────────────────────────

  @AC-34 @BR-GST-013
  Scenario: Promoter edits a PENDING entry's guest name and contact
    Given I am a Promoter on event "Birthday Bash"
    And I own the list "Ana's Crew" for event "Birthday Bash"
    And guest "João Silva" is on list "Ana's Crew" with status PENDING
    When I edit the entry for "João Silva" with:
      | name  | João Pedro Silva  |
      | email | joao@example.com  |
      | phone | +5511977770000    |
    Then the guest "João Silva" is renamed to "João Pedro Silva"
    And the guest's email is "joao@example.com"
    And the guest's phone is "+5511977770000"
    And the entry's QR code is unchanged

  @EDGE-9 @BR-GST-013
  Scenario: Editing a guest's phone after notification does not auto-resend
    Given I am a Promoter on event "Birthday Bash"
    And I own the list "Ana's Crew" for event "Birthday Bash"
    And guest "Maria Souza" is on list "Ana's Crew" with status PENDING and was already notified
    When I edit the entry for "Maria Souza" with:
      | phone | +5511966660000 |
    Then the guest's phone is "+5511966660000"
    And no automatic resend of the notification is triggered

  @AC-35 @BR-GST-013 @error
  Scenario: Editing a CHECKED_IN entry's guest fields is rejected
    Given I am the Manager of event "Birthday Bash"
    And guest "Fernanda Lima" is on list "VIP" with status CHECKED_IN
    When I attempt to edit the entry for "Fernanda Lima" with:
      | name | Fernanda Souza |
    Then I see the error "This guest has already checked in and cannot be edited"
    And the guest's name remains "Fernanda Lima"

  # ─────────────────────────────────────────────────────
  # Viewing entries
  # ─────────────────────────────────────────────────────

  @AC-32 @BR-GST-015
  Scenario: Promoter views entries on their own list with check-in status
    Given I am a Promoter on event "Birthday Bash"
    And I own the list "Ana's Crew" for event "Birthday Bash"
    And guest "João Silva" is on list "Ana's Crew" with status PENDING
    And guest "Maria Souza" is on list "Ana's Crew" with status CHECKED_IN
    When I open the list "Ana's Crew"
    Then I see the entries for "João Silva" and "Maria Souza"
    And "João Silva" is shown with status PENDING
    And "Maria Souza" is shown with status CHECKED_IN

  @AC-33 @BR-GST-015
  Scenario: Manager views entries on a PROMOTER list with promoter attribution
    Given I am the Manager of event "Birthday Bash"
    And Promoter "Pedro" owns the list "Pedro's Guests" on event "Birthday Bash"
    And guest "Bruno Rocha" is on list "Pedro's Guests" with status PENDING
    And guest "Camila Ferraz" is on list "Pedro's Guests" with status CHECKED_IN
    When I open the list "Pedro's Guests"
    Then I see the entries for "Bruno Rocha" and "Camila Ferraz"
    And "Bruno Rocha" is shown with status PENDING and Promoter "Pedro" as the owner
    And "Camila Ferraz" is shown with status CHECKED_IN and Promoter "Pedro" as the owner

  @AC-33 @BR-GST-015
  Scenario: Manager views entries on an OFFICIAL list with check-in status
    Given I am the Manager of event "Birthday Bash"
    And the list "VIP" exists for event "Birthday Bash" with type OFFICIAL
    And guest "Fernanda Lima" is on list "VIP" with status CHECKED_IN
    When I open the list "VIP"
    Then I see the entry for "Fernanda Lima"
    And "Fernanda Lima" is shown with status CHECKED_IN

  @AC-37 @error
  Scenario: User with no role on the event cannot view entries
    Given I have no role on event "Birthday Bash"
    And the list "VIP" exists for event "Birthday Bash"
    And guest "Fernanda Lima" is on list "VIP"
    When I attempt to open the list "VIP"
    Then I see the error "You do not have permission to view this event"
    And no entries are returned

  # ─────────────────────────────────────────────────────
  # Network errors
  # ─────────────────────────────────────────────────────

  @error
  Scenario: Network error during a guest operation shows a generic message
    Given I am a Promoter on event "Birthday Bash"
    And I own the list "Ana's Crew" for event "Birthday Bash"
    And the network is unavailable
    When I attempt to add, edit, or remove a guest entry on list "Ana's Crew"
    Then I see the error "Something went wrong. Please try again."
    And I remain on the current screen
