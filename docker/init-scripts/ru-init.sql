
create schema ru;

create table ru.user (
   id int not null primary key,
   email text not null unique,
   name text not null,
   password text
);
