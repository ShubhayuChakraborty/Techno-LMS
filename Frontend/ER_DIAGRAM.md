# Library Management System — ER Diagram

```mermaid
erDiagram

    USER {
        string id PK
        string name
        string email
        string password_hash
        enum role "admin | librarian | member"
        timestamp created_at
    }

    MEMBER {
        string id PK
        string user_id FK
        string name
        string email
        string phone
        string membership_no UK
        string address
        enum membership_type "basic | premium | student | standard"
        date joined_at
        date expiry_date
        boolean is_active
        int active_borrows
        decimal unpaid_fines
        int total_borrows
        string avatar_color
        timestamp created_at
        timestamp updated_at
    }

    BOOK {
        string id PK
        string title
        string author
        string isbn UK
        string category
        int year
        text description
        string publisher
        string cover_url
        int total_copies
        int available_copies
        decimal rating
        int review_count
        timestamp created_at
        timestamp updated_at
    }

    BORROW_RECORD {
        string id PK
        string member_id FK
        string book_id FK
        timestamp issued_at
        date due_date
        timestamp returned_at
        enum status "active | overdue | returned"
        boolean extended_once
        decimal fine_amount
        boolean fine_paid
        timestamp created_at
        timestamp updated_at
    }

    FINE {
        string id PK
        string borrow_id FK
        string member_id FK
        int overdue_days
        decimal amount
        boolean is_paid
        enum status "unpaid | paid | waived | pending"
        timestamp created_at
        timestamp paid_at
    }

    RECOMMENDATION {
        string id PK
        string book_id FK
        string member_id FK
        decimal score
        string strategy
        string reason
        timestamp created_at
    }

    SETTINGS {
        string key PK
        string value
        string description
    }

    SESSION {
        string id PK
        string user_id FK
        string refresh_token
        timestamp expires_at
        timestamp created_at
    }

    USER ||--|| MEMBER : "has profile"
    USER ||--o{ SESSION : "authenticates via"

    MEMBER ||--o{ BORROW_RECORD : "borrows"
    BOOK   ||--o{ BORROW_RECORD : "borrowed in"

    BORROW_RECORD ||--o| FINE : "generates"
    MEMBER        ||--o{ FINE : "owes"

    BOOK   ||--o{ RECOMMENDATION : "recommended as"
    MEMBER ||--o{ RECOMMENDATION : "receives"
```

---

## Relationships Summary

| Relationship                | Type     | Description                                        |
| --------------------------- | -------- | -------------------------------------------------- |
| `User` → `Member`           | 1 : 1    | Every member account has one user login            |
| `User` → `Session`          | 1 : N    | A user can have multiple active sessions (devices) |
| `Member` → `BorrowRecord`   | 1 : N    | A member can borrow many books over time           |
| `Book` → `BorrowRecord`     | 1 : N    | A book can be borrowed many times                  |
| `BorrowRecord` → `Fine`     | 1 : 0..1 | A borrow generates at most one fine                |
| `Member` → `Fine`           | 1 : N    | A member can accumulate many fines                 |
| `Book` → `Recommendation`   | 1 : N    | A book can be recommended to many members          |
| `Member` → `Recommendation` | 1 : N    | A member can receive many recommendations          |

---

## Key Constraints

| Rule                             | Enforcement                                                   |
| -------------------------------- | ------------------------------------------------------------- |
| Max 3 active borrows per member  | `CHECK (active_borrows <= 3)` on `MEMBER` + app logic         |
| Book available copies ≥ 0        | `CHECK (available_copies >= 0)` on `BOOK`                     |
| Extension only once per borrow   | `extended_once BOOLEAN` — set to `true` after first extension |
| Fine rate: ₹5/day overdue        | Stored in `SETTINGS` table as `fine_rate_per_day = 5`         |
| Default borrow duration: 14 days | Stored in `SETTINGS` as `borrow_duration_days = 14`           |
| Extension adds 7 days            | Stored in `SETTINGS` as `extension_days = 7`                  |
| `membership_no` globally unique  | `UK` constraint on `MEMBER.membership_no`                     |
| `isbn` globally unique           | `UK` constraint on `BOOK.isbn`                                |

---

## Atomic Transactions Required

```
── Issue Book ──────────────────────────────────────────────
BEGIN
  INSERT INTO borrow_record (member_id, book_id, ...)
  UPDATE book SET available_copies = available_copies - 1
  UPDATE member SET active_borrows = active_borrows + 1
COMMIT

── Return Book ─────────────────────────────────────────────
BEGIN
  UPDATE borrow_record SET returned_at = NOW(), status = 'returned'
  UPDATE book SET available_copies = available_copies + 1
  UPDATE member SET active_borrows = active_borrows - 1
  INSERT INTO fine (...) IF overdue
  UPDATE member SET unpaid_fines = unpaid_fines + fine_amount IF overdue
COMMIT

── Pay Fine ────────────────────────────────────────────────
BEGIN
  UPDATE fine SET is_paid = true, status = 'paid', paid_at = NOW()
  UPDATE borrow_record SET fine_paid = true
  UPDATE member SET unpaid_fines = unpaid_fines - fine.amount
COMMIT
```
