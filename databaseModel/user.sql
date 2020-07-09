CREATE TABLE Usr(
    userName CHAR(20) UNIQUE NOT NULL PRIMARY KEY,
    password CHAR(20) NOT NULL,
    admin BOOLEAN NOT NULL
);


SELECT * FROM Usr;

INSERT INTO USR VALUES ('yeahBoi', '1234', FALSE);

/*
create table usr (userName char(20) unique not null primary key, password char(20) not null, admin boolean not null);

select * from usr;

// insert master user
insert into usr values ('master', 'ImUrFather', True);

// To find master user
select * from usr where admin is true;

insert into usr values ('yeahBoi', '1234', False);
insert into usr values ('Jeez1234', 'OhJeezRick', False);
insert into usr values ('OhRightYa', 'OhMyGod', False);
insert into usr values ('yeahBoi', '1234', False);







*/