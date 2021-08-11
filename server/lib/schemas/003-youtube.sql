-- Up
create table queue_dg_tmp
(
    queueId integer not null
        primary key autoincrement,
    roomId integer not null,
    songId integer,
    userId integer not null,
    youtubeVideoId text
);

insert into queue_dg_tmp(queueId, roomId, songId, userId) select queueId, roomId, songId, userId from queue;

drop table queue;

alter table queue_dg_tmp rename to queue;

create index idxRoom
    on queue (roomId);

create table youtubeVideos
(
    id integer not null
        constraint youtubeVideos_pk
        primary key autoincrement,
    youtubeVideoId text not null,
    userId integer not null,
    thumbnail text not null,
    url text not null,
    duration integer not null,
    artist text not null,
    title text not null,
    lyrics text,
    status text not null,
    karaoke integer(1) NOT NULL DEFAULT(0)
);

create unique index youtubeVideos_youtubeVideoId_uindex
    on youtubeVideos (youtubeVideoId);


-- Down
