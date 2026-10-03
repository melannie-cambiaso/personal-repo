# Finance V2 Envelope Account Specification

## Purpose

Model a single virtual "envelope" account (e.g. "Servicios") that is funded by transfers from the
main account and pays every expense of one bound budget category. The envelope has a cumulative
balance across months, and the Movimientos tab reminds the user when a month has no transfer.

## Requirements

### Requirement: Envelope configuration is optional, single and global

The system MUST support at most one envelope config `{ name, boundCategoryId, openingBalance,
openingMonth }`, persisted globally (not month-scoped). When no config exists the system MUST
behave exactly as before this change (no `transfer` option, no envelope card, no reminder).
`openingMonth` MUST be set to the viewed month when the config is first created and MUST NOT
change when the config is later edited.

#### Scenario: No envelope configured

- GIVEN no envelope config is stored
- WHEN the user opens Movimientos
- THEN the type select MUST NOT offer "Transferencia"
- AND the tab MUST show only an entry point to configure an envelope

#### Scenario: Configuring the envelope

- GIVEN the user is viewing `2026-10` with no envelope config
- WHEN they save name "Servicios", bound category "Cuentas" and opening balance 30000
- THEN the config MUST be persisted with `openingMonth` `2026-10`

### Requirement: Transfer movement

The system MUST support a `transfer` transaction (amount, date, month, optional note) representing
money moved from the main account into the envelope. A transfer MUST NOT count as expense or
savings, MUST NOT consume any budget leaf, and MUST be offered only when an envelope is configured.

#### Scenario: Recording a payday transfer

- GIVEN an envelope is configured
- WHEN the user adds a "Transferencia" of 116000 in `2026-10`
- THEN the main balance for `2026-10` MUST decrease by 116000
- AND the envelope balance at the end of `2026-10` MUST increase by 116000
- AND no budget leaf's spent amount MAY change

### Requirement: Bound-category expenses are paid from the envelope

WHEN an expense is created with a category that is the bound category itself (childless) or one of
its subcategories, the system MUST stamp it `paidFrom: "envelope"`. The stamp is a snapshot and MUST
NOT be recomputed from the current budget config. Expenses without the stamp are paid from the main
account. Envelope-paid expenses MUST keep counting against their budget leaf in Budget and Analysis.

#### Scenario: Paying the electricity bill

- GIVEN "Cuentas" is bound and has subcategory "Luz"
- WHEN the user adds an expense of 43000 in "Luz"
- THEN the transaction MUST be stored with `paidFrom: "envelope"`
- AND the envelope balance MUST decrease by 43000
- AND the main balance MUST NOT change
- AND "Luz" MUST show 43000 spent in the Budget tab

#### Scenario: Expense outside the bound category

- GIVEN "Cuentas" is bound
- WHEN the user adds an expense in a category outside "Cuentas"
- THEN it MUST NOT be stamped and MUST reduce the main balance as today

### Requirement: Main-account monthly totals exclude envelope activity

For a month, the system MUST compute `expense` as the sum of expenses NOT paid from the envelope,
report `transfer` as its own sum, and compute `balance = income − expense − savings − transfer`.

#### Scenario: Month with salary, transfer and bills

- GIVEN income 1000000, transfer 116000, an envelope-paid expense 43000 and a main expense 20000
- WHEN totals are computed
- THEN `expense` MUST be 20000, `transfer` 116000 and `balance` 864000

### Requirement: Cumulative envelope balance

The envelope balance at the end of month M MUST equal `openingBalance + Σ transfers − Σ
envelope-paid expenses` over every month from `openingMonth` through M inclusive. It MUST be derived
from stored transactions on every load and MUST NOT be persisted. Months before `openingMonth` and
months after M MUST NOT contribute. A negative balance MUST be displayed as a warning and MUST NOT
block any action.

#### Scenario: Leftover carries into next month

- GIVEN opening balance 0 in `2026-10`, a transfer of 116000 and bills totalling 109000 in `2026-10`
- WHEN the user views `2026-11` before recording anything
- THEN the envelope card MUST show a carried-in balance of 7000

#### Scenario: Editing a past month updates the balance

- GIVEN the user deletes a 20000 bill recorded in `2026-10`
- WHEN they view `2026-11`
- THEN the carried-in balance MUST reflect the deletion

#### Scenario: Viewing a month before the envelope existed

- GIVEN `openingMonth` is `2026-10`
- WHEN the user views `2026-09`
- THEN the envelope card and reminder MUST NOT be shown

### Requirement: Missing-transfer reminder

WHEN the viewed month is ≥ `openingMonth` and contains no `transfer`, the Movimientos tab MUST show a
reminder with a suggested amount equal to the bound category's monthly budget for that month. The
reminder MUST disappear as soon as a transfer exists in the viewed month.

#### Scenario: Payday not recorded yet

- GIVEN "Cuentas" budgets 116000 for `2026-11` and `2026-11` has no transfer
- WHEN the user views `2026-11`
- THEN a reminder MUST suggest transferring 116000

#### Scenario: Bound category no longer exists

- GIVEN the bound category was deleted from the budget
- WHEN the user views Movimientos
- THEN the envelope card MUST still show balances
- AND the reminder MUST ask the user to reconfigure instead of suggesting an amount
