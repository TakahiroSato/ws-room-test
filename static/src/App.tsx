import React from "react";
import {
    Container,
    Row,
    Col,
    Button,
    ListGroup,
    ListGroupItem,
    FormGroup,
    Form,
    Label,
    Input,
} from "reactstrap";
import WebSocket from "websocket";
import Game from "./Game";

const wsUri = (window.location.protocol == 'https:' && 'wss://' || 'ws://') + window.location.host + '/ws/';
const wsClient = new WebSocket.w3cwebsocket(wsUri);

interface states {
    rooms?: string[];
    room?: string;
    userName?: string;
}

class App extends React.Component<{}, states> {
    constructor(props: {}) {
        super(props);
        this.state = {
            room: 'Main',
            rooms: [],
            userName: "名無し"
        };
        wsClient.onopen = () => {
            wsClient.send('/list');
            wsClient.send('/room');
            wsClient.send(`/name ${this.state.userName}`);
        }
        wsClient.onmessage = (e) => { this.onMessage(e); };
    }
    onMessage(e: WebSocket.IMessageEvent) {
        const json = (() => {
            try {
                return JSON.parse(e.data as string);
            } catch (e) {
                return e;
            }
        })();

        if (json.cmd) {
            console.log(json);
            switch (json.cmd) {
                case 'room':
                case 'join': {
                    this.setState({ room: json.data });
                    break;
                }
                case 'list': {
                    this.setState({ rooms: json.data });
                    break;
                }
            }
        } else {
            console.log(json);
        }
    }
    componentDidUpdate(prevProps: any) {

    }
    updateRooms() {
        wsClient.send('/list');
    }
    changeName(e: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ userName: e.target.value });
    }
    updateName() {
        wsClient.send(`/name ${this.state.userName}`);
    }
    joinRoom(room: string) {
        wsClient.send(`/join ${room}`);
    }
    render() {
        return (
            <Container>
                <header className="App-header">
                    <Row>
                        <Col md={6}>
                            <p>Room : {this.state.room}</p>
                        </Col>
                        <Col md={4} style={{ float: "right" }}>
                            <Form inline>
                                <FormGroup className="mb-2 mr-sm-2 mb-sm-0">
                                    <Label for="user-name" className="mr-sm-2">Name : </Label>
                                    <Input id="user-name" type="text" placeholder={this.state.userName} onChange={e => { this.changeName(e) }} />
                                </FormGroup>
                            </Form>
                        </Col>
                        <Button color="primary" onClick={() => this.updateName()}>更新</Button>
                    </Row>
                </header>
                <Row>
                    <Col>
                        <div className="app-body">
                            {this.state.room === "Main" ?
                                (
                                    <ListGroup>
                                        {this.state.rooms?.map(room => {
                                            return (
                                                <ListGroupItem
                                                    onClick={() => {
                                                        this.joinRoom(room);
                                                    }}
                                                    action
                                                    key={room}
                                                >
                                                    {room}
                                                </ListGroupItem>
                                            );
                                        })}
                                    </ListGroup>
                                )
                                : <Game wsClient={wsClient}></Game>}
                        </div>
                    </Col>
                </Row>
            </Container>
        );
    }
}

export default App;
