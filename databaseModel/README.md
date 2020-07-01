# Sketchy Database

## Users

it consist of 4 entities, which include id (primary key), username, password, and admin(True/False)

![](img/UserDB.png)

The schema will look something like this in sql

```psql
CREATE TABLE User(
    id INTEGER NOT NULL PRIMARY KEY,
    userName CHAR(20) NOT NULL,
    password CHAR(20) NOT NULL,
    admin BOOLEAN NOT NULL
);
```

Example Table (There will only be one admin)

| ID | Username | Password | Admin | 
|----|----------|----------|-------|
|  0 | theRealAdmin | imtherealAdmin | True
|  1 | yeahBoi7 | youHeardthatRight  | False |
|  2 | Jeez1234 | OhJeezRick | False |
|  3 | OhRightYa | OhMyGod |  False |