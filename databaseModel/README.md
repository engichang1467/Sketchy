# Sketchy Database

## Users

it consist of 3 entities, which include username (primary key), password, and admin(True/False)

![](img/UserDB.png)

The schema will look something like this in sql

```psql
CREATE TABLE usr(
    userName CHAR(20) UNIQUE NOT NULL PRIMARY KEY,
    password CHAR(20) NOT NULL,
    admin BOOLEAN NOT NULL
);
```

To insert a user

```psql
insert into usr values ('yeahBoi', '1234', False);
```

To see everything in the table

```psql
select * from usr;
```

Find master user

```psql
select * from usr where admin is true;
```


Example Table (There will only be one admin)

| Username | Password | Admin | 
|----------|----------|-------|
| theRealAdmin | imtherealAdmin | True
| yeahBoi7 | youHeardthatRight  | False |
| Jeez1234 | OhJeezRick | False |
| OhRightYa | OhMyGod |  False |