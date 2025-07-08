-- Up
CREATE TABLE IF NOT EXISTS "roles" (
  "roleId" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  "name" text NOT NULL COLLATE NOCASE,
  "data" text NOT NULL DEFAULT('{}')
);

CREATE UNIQUE INDEX IF NOT EXISTS idxName ON "roles" ("name" ASC);

INSERT INTO roles (name) VALUES ('admin'), ('player'), ('standard'), ('guest');

ALTER TABLE users ADD COLUMN "roleId" integer NOT NULL DEFAULT 0 REFERENCES roles(roleId) DEFERRABLE INITIALLY DEFERRED;

UPDATE users SET roleId = CASE
    WHEN isAdmin = 1 THEN (SELECT roleId FROM roles WHERE name = 'admin')
    WHEN isAdmin = 0 THEN (SELECT roleId FROM roles WHERE name = 'standard')
    ELSE (SELECT roleId FROM roles WHERE name = 'standard')
END;

ALTER TABLE users DROP COLUMN isAdmin;

-- Down
ALTER TABLE users ADD COLUMN isAdmin integer DEFAULT 0;

UPDATE users SET isAdmin = CASE
    WHEN roleId = (SELECT roleId FROM roles WHERE name = 'admin') THEN 1
    ELSE 0
END;

ALTER TABLE users DROP COLUMN roleId;

DROP TABLE roles;
