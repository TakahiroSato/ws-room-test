import React from "react";
import {
    Container,
    Row,
    Col,
    Button,
    ListGroup,
    ListGroupItem,
} from "reactstrap";
import WebSocket from "websocket";
import reversi from "./reversi";

interface props {
    wsClient: WebSocket.w3cwebsocket
}

interface states {
    oldListener?: (message: WebSocket.IMessageEvent) => void,
    members?: String[],
    reversi?: reversi,
    player1?: String,
    player2?: String,
    isPlayer1?: boolean,
    isPlayer2?: boolean,
}

class Game extends React.Component<props, states> {
    constructor(props: props) {
        super(props);
        this.state = {
            oldListener: props.wsClient.onmessage,
            members: [],
            reversi: new reversi(),
            player1: "",
            player2: "",
            isPlayer1: false,
            isPlayer2: false,
        }
        this.props.wsClient.onmessage = (e) => { this.onMessage(e); };
        this.props.wsClient.send("/members");
        this.updatePlayers();
    }
    componentDidMount() {
        this.state.reversi?.init("canvas2d");
        this.state.reversi?.getPositionByMouseDown((pos: {x: number, y: number}) => {
            this.props.wsClient.send(`/put_disc ${pos.x} ${pos.y}`);
        })
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
                case 'members': {
                    this.setState({ members: json.data });
                    break;
                }
                case 'registered_player1' :{
                    this.setState({ player1: json.data });
                    break;
                }
                case 'registered_player2' :{
                    this.setState({ player2: json.data });
                    break;
                }
                case 'registered_you': {
                    this.setState({ isPlayer1: false, isPlayer2: false });
                    if (json.data === 1) {
                        this.setState({ isPlayer1: true });
                    } else if (json.data === 2) {
                        this.setState({ isPlayer2: true });
                    }
                }
                case 'player' :{
                    if (json.sub_cmd === 'get') {
                        if (json.data.p === 1) this.setState({ player1: json.data.data });
                        if (json.data.p === 2) this.setState({ player2: json.data.data });
                    }
                    break;
                }
                case 'update_state': {
                    this.state.reversi?.setDiscs(json.data);
                    break;
                }
            }
        } else {
            if (e.data === "Someone connected" || e.data === "Someone disconnected") {
                this.props.wsClient.send("/members");
                this.updatePlayers();
            }
            console.log(e.data);
        }
    }
    leftRoom() {
        if (this.state.oldListener) {
            this.props.wsClient.onmessage = this.state.oldListener;
        }
        this.props.wsClient.send("/join Main")
    }
    registPlayer(num: number) {
        this.props.wsClient.send(`/player${num} regist`);
    }
    updatePlayers() {
        this.props.wsClient.send("/player1 get");
        this.props.wsClient.send("/player2 get");
    }
    start() {
        this.props.wsClient.send("/start");
    }
    p1() {
        const name = (() => {
            if (this.state.isPlayer1) {
                return "You";
            } else {
                return this.state.player1;
            }
        })();
        return (<Col>p1 : {name ? name : <Button onClick={() => this.registPlayer(1)}>regist</Button>}</Col>);
    }
    p2() {
        const name = (() => {
            if (this.state.isPlayer2) {
                return "You";
            } else {
                return this.state.player2;
            }
        })();
        return (<Col>p2 : {name ? name : <Button onClick={() => this.registPlayer(2)}>regist</Button>}</Col>);
    }
    render() {
        return (
            <Container>
                <Row>
                    {this.p1()}
                    {this.p2()}
                    <Col><Button color="primary" onClick={() => this.start()}>start</Button></Col>
                </Row>
                <Row style={{ paddingTop: "10px" }}>
                    <canvas id="canvas2d" width="60px" height="60px"></canvas>
                </Row>
                <Row>
                    <ListGroup>
                        {this.state.members?.map(member => {
                            return <ListGroupItem>{member}</ListGroupItem>;
                        })}
                    </ListGroup>
                </Row>
                <Row><Button onClick={() => this.leftRoom()}>退室</Button></Row>
            </Container>
        );
    }
}

export default Game;