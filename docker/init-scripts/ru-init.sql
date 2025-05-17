
create schema ru;

create table ru.user (
   id int not null primary key,
   email text not null unique,
   name text not null,
   password text
);

-- insert into ru.user(id,email,name,password) values (1,'john.doe@email.com','John Doe','any_password');
