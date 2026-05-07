Feature: Notifications
  As a guest added to a list
  I want to receive my QR code on WhatsApp, SMS, or Email
  So that I can present it at the door without checking the app

  Background:
    Given the event "Festa de Aniversário" exists on "2026-06-12 22:00" at venue "Clube Lapa, Rio de Janeiro"
    And the event has a list "VIP"

  # ────────────────────────────────────────────────
  # Channel selection by contact info (AC-1..AC-4, EDGE-1..EDGE-4)
  # ────────────────────────────────────────────────

  @AC-1 @BR-NTF-001 @BR-NTF-002 @BR-NTF-003 @edge-case @EDGE-2
  Scenario: Guest with phone only receives a WhatsApp notification
    Given guest "João Silva" with phone "+5511999998888"
    When I add "João Silva" to list "VIP"
    Then "João Silva" receives a WhatsApp notification with their QR code
    And "João Silva" receives no SMS notification
    And "João Silva" receives no Email notification

  @AC-2 @BR-NTF-001 @BR-NTF-002 @BR-NTF-003 @edge-case @EDGE-3
  Scenario: Guest with email only receives an Email notification
    Given guest "Mariana Costa" with email "mariana@example.com"
    When I add "Mariana Costa" to list "VIP"
    Then "Mariana Costa" receives an Email notification with their QR code
    And "Mariana Costa" receives no WhatsApp notification
    And "Mariana Costa" receives no SMS notification

  @AC-3 @BR-NTF-001 @BR-NTF-002 @BR-NTF-003 @edge-case @EDGE-4
  Scenario: Guest with both phone and email receives WhatsApp and Email
    Given guest "Pedro Almeida" with phone "+5521988887777" and email "pedro@example.com"
    When I add "Pedro Almeida" to list "VIP"
    Then "Pedro Almeida" receives a WhatsApp notification with their QR code
    And "Pedro Almeida" receives an Email notification with their QR code
    And "Pedro Almeida" receives no SMS notification

  @AC-4 @BR-NTF-001 @edge-case @EDGE-1
  Scenario: Guest with no contact info triggers no notification
    Given guest "Carla Mendes" with no contact info
    When I add "Carla Mendes" to list "VIP"
    Then no notification is dispatched
    And no delivery failure is logged
    And "Carla Mendes" is added to list "VIP" without error

  @BR-NTF-001 @BR-NTF-003
  Scenario Outline: Channel permutations follow contact-info presence
    Given guest "<name>" with <contact-info>
    When I add "<name>" to list "VIP"
    Then the dispatched channels are: <channels>

    Examples:
      | name           | contact-info                                            | channels         |
      | João Silva     | phone "+5511999998888"                                  | WhatsApp         |
      | Mariana Costa  | email "mariana@example.com"                             | Email            |
      | Pedro Almeida  | phone "+5521988887777" and email "pedro@example.com"    | WhatsApp, Email  |
      | Carla Mendes   | no contact info                                         | none             |

  # ────────────────────────────────────────────────
  # Failure handling and SMS fallback (AC-5..AC-7)
  # ────────────────────────────────────────────────

  @AC-5 @BR-NTF-003 @BR-NTF-004 @error
  Scenario: WhatsApp failure triggers SMS fallback
    Given guest "Lucas Oliveira" with phone "+5511977776666"
    And WhatsApp dispatch will fail for "+5511977776666"
    When I add "Lucas Oliveira" to list "VIP"
    Then "Lucas Oliveira" receives an SMS notification with their QR code
    And "Lucas Oliveira" is added to list "VIP" without error

  @AC-6 @BR-NTF-005 @error
  Scenario: WhatsApp failure with SMS fallback success is still logged
    Given guest "Lucas Oliveira" with phone "+5511977776666"
    And WhatsApp dispatch will fail for "+5511977776666"
    When I add "Lucas Oliveira" to list "VIP"
    Then a delivery failure is logged for channel "WhatsApp"
    And no delivery failure is logged for channel "SMS"

  @AC-7 @BR-NTF-004 @BR-NTF-005 @error
  Scenario: All channels fail — guest still added, every failure logged
    Given guest "Beatriz Souza" with phone "+5531966665555" and email "bia@example.com"
    And WhatsApp dispatch will fail for "+5531966665555"
    And SMS dispatch will fail for "+5531966665555"
    And Email dispatch will fail for "bia@example.com"
    When I add "Beatriz Souza" to list "VIP"
    Then "Beatriz Souza" receives no WhatsApp notification
    And "Beatriz Souza" receives no SMS notification
    And "Beatriz Souza" receives no Email notification
    And a delivery failure is logged for channel "WhatsApp"
    And a delivery failure is logged for channel "SMS"
    And a delivery failure is logged for channel "Email"
    And "Beatriz Souza" is added to list "VIP" without error

  @BR-NTF-005 @error
  Scenario: Email failure with WhatsApp success — only Email failure is logged
    Given guest "Pedro Almeida" with phone "+5521988887777" and email "pedro@example.com"
    And Email dispatch will fail for "pedro@example.com"
    When I add "Pedro Almeida" to list "VIP"
    Then "Pedro Almeida" receives a WhatsApp notification with their QR code
    And a delivery failure is logged for channel "Email"
    And no delivery failure is logged for channel "WhatsApp"

  @BR-NTF-004 @BR-NTF-005 @error
  Scenario: Notification infrastructure itself is unavailable — guest still added
    Given guest "Rafael Lima" with phone "+5511955554444" and email "rafa@example.com"
    And the notification system is unavailable
    When I add "Rafael Lima" to list "VIP"
    Then "Rafael Lima" is added to list "VIP" without error
    And a delivery failure is logged

  # ────────────────────────────────────────────────
  # Trigger applies across all list types (AC-8..AC-10)
  # ────────────────────────────────────────────────

  @AC-8 @BR-NTF-009 @BR-LST-002
  Scenario: Adding a guest to an OFFICIAL list dispatches a notification
    Given I am signed in as the Manager of "Festa de Aniversário"
    And the event has an OFFICIAL list "Camarote"
    And guest "Fernanda Rocha" with phone "+5511944443333"
    When I add "Fernanda Rocha" to list "Camarote"
    Then "Fernanda Rocha" receives a WhatsApp notification with their QR code

  @AC-9 @BR-NTF-009 @BR-LST-003
  Scenario: Adding a guest to a PROMOTER list dispatches a notification
    Given I am signed in as a Promoter of "Festa de Aniversário"
    And I have a PROMOTER list "Lista do Bruno"
    And guest "Camila Ferreira" with email "camila@example.com"
    When I add "Camila Ferreira" to list "Lista do Bruno"
    Then "Camila Ferreira" receives an Email notification with their QR code

  @AC-10 @BR-NTF-009 @BR-LST-004 @edge-case @EDGE-7
  Scenario: Door-sale entry with captured contact info dispatches a notification
    Given I am signed in as a Host of "Festa de Aniversário"
    And the event has door sales enabled with tier "Pista" priced at "R$50"
    When I record a door sale on tier "Pista" for "Thiago Barros" with phone "+5511933332222"
    Then "Thiago Barros" receives a WhatsApp notification with their QR code

  @BR-NTF-009 @BR-LST-004 @edge-case @EDGE-7
  Scenario: Door-sale entry without captured contact info dispatches no notification
    Given I am signed in as a Host of "Festa de Aniversário"
    And the event has door sales enabled with tier "Pista" priced at "R$50"
    When I record a door sale on tier "Pista" with document only and no contact info
    Then no notification is dispatched
    And no delivery failure is logged

  # ────────────────────────────────────────────────
  # Content, language, and recipient scope (AC-11..AC-13)
  # ────────────────────────────────────────────────

  @AC-11 @BR-NTF-006
  Scenario: Notification content includes event details and QR code
    Given guest "João Silva" with phone "+5511999998888"
    When I add "João Silva" to list "VIP"
    Then the WhatsApp notification to "João Silva" contains:
      | guest name     | João Silva                  |
      | event name     | Festa de Aniversário        |
      | event date     | 2026-06-12 22:00            |
      | location       | Clube Lapa, Rio de Janeiro  |
      | QR code        | present                     |

  @AC-11 @BR-NTF-006
  Scenario: Email notification content also includes event details and QR code
    Given guest "Mariana Costa" with email "mariana@example.com"
    When I add "Mariana Costa" to list "VIP"
    Then the Email notification to "Mariana Costa" contains:
      | guest name     | Mariana Costa               |
      | event name     | Festa de Aniversário        |
      | event date     | 2026-06-12 22:00            |
      | location       | Clube Lapa, Rio de Janeiro  |
      | QR code        | present                     |

  @AC-12 @BR-NTF-008
  Scenario: Notifications are written in PT-BR
    Given guest "João Silva" with phone "+5511999998888"
    When I add "João Silva" to list "VIP"
    Then the WhatsApp notification to "João Silva" is written in Brazilian Portuguese

  @AC-13 @BR-NTF-007
  Scenario: Adding a Manager or Host to the team does not dispatch a guest notification
    Given a user "Roberto Dias" with email "roberto@example.com" exists
    When "Roberto Dias" is added as a Manager of "Festa de Aniversário"
    Then no notification is dispatched to "Roberto Dias"

  # ────────────────────────────────────────────────
  # Same-person-multiple-lists and re-add behavior (EDGE-5, EDGE-6)
  # ────────────────────────────────────────────────

  @edge-case @EDGE-5 @BR-GST-003
  Scenario: Same person on two different lists receives two notifications
    Given the event has a PROMOTER list "Lista do Bruno"
    And the event has a PROMOTER list "Lista da Júlia"
    And guest "João Silva" with phone "+5511999998888"
    When I add "João Silva" to list "Lista do Bruno"
    And I add "João Silva" to list "Lista da Júlia"
    Then "João Silva" receives 2 WhatsApp notifications
    And each notification contains a different QR code

  @edge-case @EDGE-6
  Scenario: Re-adding a guest after removal triggers a fresh notification
    Given guest "João Silva" with phone "+5511999998888"
    And "João Silva" was previously added to list "VIP" and then removed
    When I add "João Silva" to list "VIP" again
    Then "João Silva" receives a WhatsApp notification with their QR code
    And the QR code is different from the previously issued one
