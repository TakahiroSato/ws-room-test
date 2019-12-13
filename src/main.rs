use std::time::{Duration, Instant};

use actix::*;
use actix_files as fs;
use actix_web::{web, App, Error, HttpRequest, HttpResponse, HttpServer};
use actix_web_actors::ws;

use serde_json::json;

use ws_room_test::server;

/// How often hertbeat pings are sent
const HEARTBEAT_INTERVAL: Duration = Duration::from_secs(5);
/// How long before lack of client response causes a timeout
const CLIENT_TIMEOUT: Duration = Duration::from_secs(10);

//const SEND_STATE_INTERVAL: Duration = Duration::from_secs(5);

/// Entry point for our route
fn chat_route(
    req: HttpRequest,
    stream: web::Payload,
    srv: web::Data<Addr<server::Server>>,
) -> Result<HttpResponse, Error> {
    ws::start(
        WsSession {
            id: 0,
            hb: Instant::now(),
            room: "Main".to_owned(),
            name: None,
            addr: srv.get_ref().clone(),
        },
        &req,
        stream,
    )
}

struct WsSession {
    /// unique session id
    id: usize,
    /// Cient must send ping at least once per 10 seconds (CLIENT_TIMEOUT),
    /// otherwise we drop connection,
    hb: Instant,
    /// joined room
    room: String,
    /// peer name
    name: Option<String>,
    /// server
    addr: Addr<server::Server>,
}

impl Actor for WsSession {
    type Context = ws::WebsocketContext<Self>;

    /// Method is called on actor start.
    /// We register ws session with Server
    fn started(&mut self, ctx: &mut Self::Context) {
        // we'll start hertbeat process on session start.
        self.hb(ctx);

        //self.send_state(ctx);

        // register self in chat server. `AsyncContext::wait` register
        // future within context, but context waits until this future resolves
        // before processing any other events.
        // HttpContext::state() is instance of WsSessionState, state is shared
        // across all routes within application
        let addr = ctx.address();
        self.addr
            .send(server::Connect {
                addr: addr.recipient(),
            })
            .into_actor(self)
            .then(|res, act, ctx| {
                match res {
                    Ok(res) => act.id = res,
                    // something is wrong with server
                    _ => ctx.stop(),
                }
                fut::ok(())
            })
            .wait(ctx);
    }

    fn stopping(&mut self, _: &mut Self::Context) -> Running {
        // notify server
        self.addr.do_send(server::Disconnect { id: self.id });
        Running::Stop
    }
}

/// Handle messages from server, we simply send it to peer websocket
impl Handler<server::Message> for WsSession {
    type Result = ();

    fn handle(&mut self, msg: server::Message, ctx: &mut Self::Context) {
        ctx.text(msg.0);
    }
}

impl WsSession {
    fn room(&mut self, ctx: &mut ws::WebsocketContext<Self>) {
        ctx.text(
            json!({
                "cmd": "room",
                "data": self.room
            })
            .to_string(),
        );
    }
    fn list(&mut self, ctx: &mut ws::WebsocketContext<Self>) {
        // Send ListRooms message to chat server and wait for
        // response
        println!("List rooms");
        self.addr
            .send(server::ListRooms)
            .into_actor(self)
            .then(|res, _, ctx| {
                match res {
                    Ok(rooms) => {
                        ctx.text(
                            json!({
                                "cmd": "list",
                                "data": &rooms
                            })
                            .to_string(),
                        );
                    }
                    _ => println!("Something is wrong"),
                }
                fut::ok(())
            })
            .wait(ctx)
        // .wait(ctx) pauses all events in context,
        // so actor wont receive any new message until it get list
        // of rooms back
    }
    fn join(&mut self, v: Vec<&str>, ctx: &mut ws::WebsocketContext<Self>) {
        if v.len() == 2 {
            self.room = v[1].to_owned();
            self.addr.do_send(server::Join {
                id: self.id,
                name: self.room.clone(),
            });

            ctx.text(
                json!({
                    "cmd": "join",
                    "data": self.room.clone(),
                })
                .to_string(),
            );
        } else {
            ctx.text("!!! room name is required");
        }
    }
    fn name(&mut self, v: Vec<&str>, ctx: &mut ws::WebsocketContext<Self>) {
        if v.len() == 2 {
            self.name = Some(v[1].to_owned());
            self.addr.do_send(server::SetName {
                id: self.id,
                new_name: self.name.clone().unwrap_or("名無し".to_owned()),
            });
        } else {
            ctx.text("!!! name is required");
        }
    }
    fn members(&mut self, ctx: &mut ws::WebsocketContext<Self>) {
        self.addr
            .send(server::GetMemberNames {
                room: self.room.clone(),
            })
            .into_actor(self)
            .then(|res, _, ctx| {
                match res {
                    Ok(members) => {
                        ctx.text(
                            json!({
                                "cmd": "members",
                                "data": &members
                            })
                            .to_string(),
                        );
                    }
                    _ => println!("Something is wrong"),
                }
                fut::ok(())
            })
            .wait(ctx);
    }
    fn start(&mut self, ctx: &mut ws::WebsocketContext<Self>) {
        self.addr
            .send(server::Start {
                room: self.room.clone(),
            })
            .into_actor(self)
            .then(|res, _, ctx| {
                match res {
                    Ok(r) => {
                        let json = match r {
                            Ok(r) => json!({
                                "cmd": "start",
                                "reulst": "success",
                                "data": r
                            }),
                            Err(r) => json!({
                                "cmd": "start",
                                "result": "failed",
                                "data": r,
                            }),
                        };
                        ctx.text(json.to_string());
                    }
                    _ => println!("Something is wrong"),
                }
                fut::ok(())
            })
            .wait(ctx);
    }
}

/// WebSocket message handler
impl StreamHandler<ws::Message, ws::ProtocolError> for WsSession {
    fn handle(&mut self, msg: ws::Message, ctx: &mut Self::Context) {
        println!("WEBSOCKET MESSAGE: {:?}", msg);
        match msg {
            ws::Message::Ping(msg) => {
                self.hb = Instant::now();
                ctx.pong(&msg);
            }
            ws::Message::Pong(_) => {
                self.hb = Instant::now();
            }
            ws::Message::Text(text) => {
                let m = text.trim();
                // we check for /sss type of messages
                if m.starts_with('/') {
                    let v: Vec<&str> = m.splitn(2, ' ').collect();
                    match v[0] {
                        "/room" => self.room(ctx),
                        "/list" => self.list(ctx),
                        "/join" => self.join(v, ctx),
                        "/name" => self.name(v, ctx),
                        "/members" => self.members(ctx),
                        "/start" => self.start(ctx),
                        _ => ctx.text(format!("!!! unknown command: {:?}", m)),
                    }
                } else {
                    let msg = if let Some(ref name) = self.name {
                        format!("{}: {}", name, m)
                    } else {
                        m.to_owned()
                    };
                    // send message to chat server
                    self.addr.do_send(server::ClientMessage {
                        id: self.id,
                        msg,
                        room: self.room.clone(),
                    })
                }
            }
            ws::Message::Binary(_) => println!("Unexpected binary"),
            ws::Message::Close(_) => {
                ctx.stop();
            }
            ws::Message::Nop => (),
        }
    }
}

impl WsSession {
    /// helper method that sends ping to client every second
    ///
    /// also this method checks hertbeats from client
    fn hb(&self, ctx: &mut ws::WebsocketContext<Self>) {
        ctx.run_interval(HEARTBEAT_INTERVAL, |act, ctx| {
            // check client heartbeats
            if Instant::now().duration_since(act.hb) > CLIENT_TIMEOUT {
                // heartbeat timed out
                println!("Websocket Client heartbeat failed, disconnecting!");

                // notify chat server
                act.addr.do_send(server::Disconnect { id: act.id });

                // stop actor
                ctx.stop();

                // don't try to send a ping
                return;
            }

            ctx.ping("");
        });
    }

    // fn send_state(&self, ctx: &mut ws::WebsocketContext<Self>) {
    //     ctx.run_interval(SEND_STATE_INTERVAL, |act, ctx| {
    //         ctx.text(json!({
    //             "cmd": "state",
    //             "room": act.room
    //         }).to_string());
    //     });
    // }
}

fn main() -> std::io::Result<()> {
    env_logger::init();
    let sys = System::new("ws-example");

    // Start server actor
    let server = server::Server::default().start();

    // Create Http server with websocket support
    HttpServer::new(move || {
        App::new()
            .data(server.clone())
            // redirect to websocket.html
            .service(web::resource("/").route(web::get().to(|| {
                HttpResponse::Found()
                    .header("LOCATION", "/index.html")
                    .finish()
            })))
            // websocket
            .service(web::resource("/ws/").to(chat_route))
            // static resources
            .service(fs::Files::new("/", "static/build/"))
    })
    .bind("0.0.0.0:8080")?
    .start();

    sys.run()
}

#[cfg(test)]
mod tests {
    #[test]
    fn test() {
        let rooms = ["room1", "room2", "room3"];
        for i in &rooms {
            println!("{}", i.to_owned());
        }
    }
}
