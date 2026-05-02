# ERP System – User Management Requirements

## User Roles

- **owner**
  - Can observe everything.
  - Only one owner is allowed.
  - Owner signs up first.
  - After the first owner signs up, no other owner sign-up is allowed.

- **casher**
  - Can only observe specific allowed data (e.g., sales, assigned tasks).
  - Cannot see owner-level data.

## Signup Flow

### Owner Signup
- Only one owner can sign up initially.
- After the first successful owner signup, the owner signup button/endpoint is disabled for any further owner sign-ups.

### Casher Signup
- A casher cannot self-register.
- The owner must invite the casher via email.

## Invitation Flow for Casher

1. Owner logs in.
2. Owner invites a casher by providing the casher's email address.
3. The system sends an invitation email to the casher containing a confirmation link (token).
4. The casher receives the invitation email and clicks the confirmation link.
5. After successful confirmation, the casher sets their password.
6. The casher can now log in with their email and newly set password.

## Login Flow

- **Owner login**
  - Logs in with email and password.
- **Casher login**
  - Logs in with invitation-confirmed email and password.

- The system must enforce role-based access:
  - `owner` sees all data.
  - `casher` sees only their allowed data.

## Database Requirements (Supabase / PostgreSQL)

### Users table structure

| Column                 | Type      | Constraints / Notes                                    |
|------------------------|-----------|--------------------------------------------------------|
| id                     | uuid      | primary key, default `gen_random_uuid()`               |
| email                  | text      | unique, not null                                       |
| password_hash          | text      | not null                                               |
| role                   | text      | not null, check `role IN ('owner','casher')`           |
| invited_by             | uuid      | nullable, references `users(id)`                       |
| invitation_confirmed   | boolean   | default false                                          |
| created_at             | timestamptz | default now()                                        |
| updated_at             | timestamptz | default now()                                        |

### SQL requirements

- Provide the complete `CREATE TABLE` statement.
- Add all necessary constraints:
  - Unique email.
  - Role check constraint.
  - Foreign key on `invited_by`.
- Include logic (e.g., a partial unique index or trigger) to ensure **only one owner** can exist in the table.

```sql
-- Example placeholder for table creation + one-owner constraint
CREATE TABLE users (...);
-- Add constraint/trigger that prevents inserting a second owner