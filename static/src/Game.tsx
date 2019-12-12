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
}

class Game extends React.Component<props, states> {
    constructor(props: props) {
        super(props);
        this.state = {
            oldListener: props.wsClient.onmessage,
            members: [],
            reversi: new reversi(),
        }
        this.props.wsClient.onmessage = (e) => { this.onMessage(e); };
        this.props.wsClient.send("/members");
    }
    componentDidMount() {
        this.state.reversi?.init();
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
                }
            }
        } else {
            if (e.data === "Someone connected" || e.data === "Someone disconnected") {
                this.props.wsClient.send("/members");
            }
            console.log(json);
        }
    }
    leftRoom() {
        if (this.state.oldListener) {
            this.props.wsClient.onmessage = this.state.oldListener;
        }
        this.props.wsClient.send("/join Main")
    }
    render() {
        return (
            <Container>
                <Row>
                    <canvas id="canvas2d" width="800px" height="800px"></canvas>
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