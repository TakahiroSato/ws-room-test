//! `Server` is an actor. It maintains list of connection client session.
//! And manages available rooms. Peers send messages to other peers in same
//! room through `Server`.

use actix::prelude::*;
use rand::{self, rngs::ThreadRng, Rng};
use serde::Serialize;
use serde_json::json;
use std::cell::RefCell;
use std::collections::{HashMap, HashSet};

use crate::reversi::Reversi;

/// Chat server sends this messages to session
#[derive(Message)]
pub struct Message(pub String);

/// Message for chat server communications

/// New chat session is created
#[derive(Message)]
#[rtype(usize)]
pub struct Connect {
    pub addr: Recipient<Message>, // 親アクター（クライアント）のアドレス
}

/// Session is disconnected
#[derive(Message)]
pub struct Disconnect {
    pub id: usize,
}

/// Send message to specific room
#[derive(Message)]
pub struct ClientMessage {
    /// Id of the client session
    pub id: usize,
    /// Peer message
    pub msg: String,
    /// Room name
    pub room: String,
}

/// List of available rooms
pub struct ListRooms;

impl actix::Message for ListRooms {
    type Result = Vec<String>;
}

/// Join room, if room does not exists create new one
#[derive(Message)]
pub struct Join {
    /// Client id
    pub id: usize,
    /// Room name
    pub name: String,
}

struct User {
    pub name: RefCell<String>,
    pub addr: Recipient<Message>,
}

pub struct Server {
    sessions: HashMap<usize, User>,
    rooms: HashMap<String, HashSet<usize>>,
    reversies: HashMap<String, Reversi>,
    rng: ThreadRng,
}

impl Default for Server {
    fn default() -> Server {
        // default room
        let mut rooms = HashMap::new();
        let mut reversies = HashMap::new();
        rooms.insert("Main".to_owned(), HashSet::new());
        let default_rooms = ["room1", "room2", "room3", "room4", "room5"];
        for room in &default_rooms {
            rooms.insert(room.to_string(), HashSet::new());
            reversies.insert(room.to_string(), Reversi::new());
        }

        Server {
            sessions: HashMap::new(),
            rooms,
            reversies,
            rng: rand::thread_rng(),
        }
    }
}

impl Server {
    /// Send message to all users in the room
    fn send_message(&self, room: &str, message: &str, skip_id: usize) {
        if let Some(sessions) = self.rooms.get(room) {
            for id in sessions {
                if *id != skip_id {
                    if let Some(user) = self.sessions.get(id) {
                        let _ = user.addr.do_send(Message(message.to_owned()));
                    }
                }
            }
        }
    }

    fn get_user_name(&self, id: usize) -> String {
        if let Some(user) = self.sessions.get(&id) {
            return user.name.borrow_mut().clone();
        }
        "".to_owned()
    }

    fn unregist_reversi_player(&self, id: usize) {
        for (_, reversi) in self.reversies.iter() {
            if reversi.player1_id.get() == id {
                reversi.player1_id.set(0);
            }
            if reversi.player2_id.get() == id {
                reversi.player2_id.set(0);
            }
        }
    }
}

/// Make actor from `Server`
impl Actor for Server {
    /// We are going to use simple Context, we just need ability to communicate
    /// with other actors.
    type Context = Context<Self>;
}

/// Handler for Connect message.
///
/// Register new session and assign unique id to this session
impl Handler<Connect> for Server {
    type Result = usize;

    fn handle(&mut self, msg: Connect, _: &mut Context<Self>) -> Self::Result {
        println!("Someone joined");

        // notify all users in same room
        self.send_message(&"Main".to_owned(), "Someone joined", 0);

        // register session with random id
        let id = self.rng.gen::<usize>();
        self.sessions.insert(
            id,
            User {
                name: RefCell::new("名無し".to_owned()),
                addr: msg.addr,
            },
        );

        // auto join session to Main room
        self.rooms.get_mut(&"Main".to_owned()).unwrap().insert(id);

        // send id back
        id
    }
}

/// Handler for Disconnect message.
impl Handler<Disconnect> for Server {
    type Result = ();

    fn handle(&mut self, msg: Disconnect, _: &mut Context<Self>) {
        println!("Someone disconnected");

        let mut rooms: Vec<String> = Vec::new();

        // remove address
        if self.sessions.remove(&msg.id).is_some() {
            // remove session from all rooms
            for (name, sessions) in &mut self.rooms {
                if sessions.remove(&msg.id) {
                    rooms.push(name.to_owned());
                }
            }
        }
        self.unregist_reversi_player(msg.id);

        // send message to other users
        for room in rooms {
            self.send_message(&room, "Someone disconnected", 0);
        }
    }
}

/// Handler for Message message.
impl Handler<ClientMessage> for Server {
    type Result = ();

    fn handle(&mut self, msg: ClientMessage, _: &mut Context<Self>) {
        self.send_message(&msg.room, msg.msg.as_str(), msg.id);
    }
}

/// Handler for `ListRooms` message.
impl Handler<ListRooms> for Server {
    type Result = MessageResult<ListRooms>;

    fn handle(&mut self, _: ListRooms, _: &mut Context<Self>) -> Self::Result {
        let mut rooms = Vec::new();

        for key in self.rooms.keys() {
            if key == "Main" {
                continue;
            }
            rooms.push(key.to_owned())
        }

        rooms.sort();
        MessageResult(rooms)
    }
}

/// Join room, send disconnect message to old room
/// send join message to new room
impl Handler<Join> for Server {
    type Result = ();

    fn handle(&mut self, msg: Join, _: &mut Context<Self>) {
        let Join { id, name } = msg;
        let mut rooms = Vec::new();

        // remove session from all rooms
        for (n, sessions) in &mut self.rooms {
            if sessions.remove(&id) {
                rooms.push(n.to_owned());
            }
        }
        self.unregist_reversi_player(id);

        // send message to other users
        for room in rooms {
            self.send_message(&room, "Someone disconnected", 0);
        }

        if self.rooms.get_mut(&name).is_none() {
            self.rooms.insert(name.clone(), HashSet::new());
        }
        self.send_message(&name, "Someone connected", id);
        self.rooms.get_mut(&name).unwrap().insert(id);
    }
}

#[derive(Message)]
pub struct SetName {
    pub id: usize,
    pub new_name: String,
}
impl Handler<SetName> for Server {
    type Result = ();

    fn handle(&mut self, msg: SetName, _: &mut Context<Self>) -> Self::Result {
        let SetName { id, new_name } = msg;
        if let Some(user) = self.sessions.get(&id) {
            user.name.replace(new_name);
        }
    }
}

pub struct GetMemberNames {
    pub room: String,
}
impl actix::Message for GetMemberNames {
    type Result = Vec<String>;
}
impl Handler<GetMemberNames> for Server {
    type Result = MessageResult<GetMemberNames>;

    fn handle(&mut self, msg: GetMemberNames, _: &mut Context<Self>) -> Self::Result {
        let mut ret: Vec<String> = Vec::new();
        if let Some(sessions) = self.rooms.get(&msg.room) {
            for id in sessions {
                if let Some(user) = self.sessions.get(id) {
                    ret.push(user.name.borrow_mut().clone());
                }
            }
        }
        ret.sort();
        MessageResult(ret)
    }
}

pub struct Start {
    pub room: String,
}
impl actix::Message for Start {
    type Result = Result<String, String>;
}
impl Handler<Start> for Server {
    type Result = MessageResult<Start>;

    fn handle(&mut self, msg: Start, _: &mut Context<Self>) -> Self::Result {
        if let Some(sessions) = self.rooms.get(&msg.room) {
            if sessions.len() < 2 {
                return MessageResult(Err("not enough members".to_owned()));
            }
        }
        if let Some(reversi) = self.reversies.get(&msg.room) {
            if reversi.player1_id.get() == 0 || reversi.player2_id.get() == 0 {
                return MessageResult(Err("please regeist player1 and player2".to_owned()));
            }
            reversi.init();
            self.send_message(
                &msg.room,
                &json!({
                    "cmd": "start",
                    "data": reversi.get_states()
                })
                .to_string(),
                0,
            );
            return MessageResult(Ok("success".to_owned()));
        }
        MessageResult(Err("something wrong".to_owned()))
    }
}

#[derive(Serialize, Clone)]
pub enum Player {
    One = 1,
    Two = 2,
}

#[derive(Message)]
#[rtype(String)]
pub struct GetPlayer {
    pub room: String,
    pub player: Player,
}
impl Handler<GetPlayer> for Server {
    type Result = String;

    fn handle(&mut self, msg: GetPlayer, _: &mut Context<Self>) -> Self::Result {
        if let Some(reversi) = self.reversies.get(&msg.room) {
            return match msg.player {
                Player::One => self.get_user_name(reversi.player1_id.get()),
                Player::Two => self.get_user_name(reversi.player2_id.get()),
            };
        }
        "".to_owned()
    }
}

#[derive(Message)]
pub struct RegistPlayer {
    pub room: String,
    pub id: usize,
    pub player: Player,
}
impl Handler<RegistPlayer> for Server {
    type Result = ();

    fn handle(&mut self, msg: RegistPlayer, _: &mut Context<Self>) -> Self::Result {
        if let Some(reversi) = self.reversies.get(&msg.room) {
            match msg.player {
                Player::One => {
                    if reversi.player1_id.get() == 0 && msg.id != reversi.player2_id.get() {
                        reversi.player1_id.set(msg.id);
                        self.send_message(
                            &msg.room,
                            &json!({
                                "cmd": "registered_player1",
                                "data": self.get_user_name(msg.id),
                            })
                            .to_string(),
                            0,
                        );
                    }
                }
                Player::Two => {
                    if reversi.player2_id.get() == 0 && msg.id != reversi.player1_id.get() {
                        reversi.player2_id.set(msg.id);
                        self.send_message(
                            &msg.room,
                            &json!({
                                "cmd": "registered_player2",
                                "data": self.get_user_name(msg.id),
                            })
                            .to_string(),
                            0,
                        );
                    }
                }
            }
        }
    }
}
